import { PlanType, UsageEventType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

const FREE_WEEKLY_QUESTION_LIMIT = 200;
const FREE_WEEKLY_INSIGHT_LIMIT = 1;
const PREMIUM_DAILY_INSIGHT_LIMIT_PER_CHILD = 1;

const CHILD_LIMITS: Record<PlanType, number> = {
  FREE: 1,
  PREMIUM: 5
};

const startOfUtcDay = (now = new Date()) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

const getPlanLimitErrorMessage = (plan: PlanType) => {
  if (plan === 'FREE') {
    return 'Free plan supports 1 child profile. Upgrade to Premium to add up to 5 children.';
  }

  return 'Premium plan supports up to 5 child profiles.';
};

export const planQuotaService = {
  async getUserPlan(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true }
    });

    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    return user.plan;
  },

  getChildLimit(plan: PlanType) {
    return CHILD_LIMITS[plan];
  },

  getWeeklyQuestionLimit(plan: PlanType) {
    return plan === 'FREE' ? FREE_WEEKLY_QUESTION_LIMIT : null;
  },

  getWeeklyInsightLimit(plan: PlanType) {
    return plan === 'FREE' ? FREE_WEEKLY_INSIGHT_LIMIT : null;
  },

  getDailyInsightLimitPerChild(plan: PlanType) {
    return plan === 'PREMIUM' ? PREMIUM_DAILY_INSIGHT_LIMIT_PER_CHILD : null;
  },

  getCurrentWeekRange(now = new Date()) {
    const dayStart = startOfUtcDay(now);
    const dayOfWeek = dayStart.getUTCDay();
    const daysSinceMonday = (dayOfWeek + 6) % 7;
    const weekStart = new Date(dayStart);
    weekStart.setUTCDate(dayStart.getUTCDate() - daysSinceMonday);

    const nextWeekStart = new Date(weekStart);
    nextWeekStart.setUTCDate(weekStart.getUTCDate() + 7);
    const weekEnd = new Date(nextWeekStart.getTime() - 1);

    return { weekStart, nextWeekStart, weekEnd };
  },

  getCurrentDayRange(now = new Date()) {
    const dayStart = startOfUtcDay(now);
    const nextDayStart = new Date(dayStart);
    nextDayStart.setUTCDate(dayStart.getUTCDate() + 1);
    const dayEnd = new Date(nextDayStart.getTime() - 1);

    return { dayStart, nextDayStart, dayEnd };
  },

  async getUsageStatus(userId: string) {
    const plan = await this.getUserPlan(userId);
    const { weekStart, nextWeekStart, weekEnd } = this.getCurrentWeekRange();
    const weeklyQuestionLimit = this.getWeeklyQuestionLimit(plan);
    const weeklyInsightLimit = this.getWeeklyInsightLimit(plan);
    const dailyInsightLimitPerChild = this.getDailyInsightLimitPerChild(plan);
    const childrenLimit = this.getChildLimit(plan);

    const [questionUsage, insightUsage, childrenUsed] = await Promise.all([
      prisma.usageEvent.aggregate({
        where: {
          userId,
          eventType: UsageEventType.QUESTION_GENERATION,
          createdAt: {
            gte: weekStart,
            lt: nextWeekStart
          }
        },
        _sum: { count: true }
      }),
      prisma.usageEvent.aggregate({
        where: {
          userId,
          eventType: UsageEventType.AI_INSIGHT_GENERATION,
          createdAt: {
            gte: weekStart,
            lt: nextWeekStart
          }
        },
        _sum: { count: true }
      }),
      prisma.childProfile.count({
        where: { userId }
      })
    ]);

    const questionsUsedThisWeek = questionUsage._sum.count ?? 0;
    const insightsUsedThisWeek = insightUsage._sum.count ?? 0;

    return {
      plan,
      questionsUsedThisWeek,
      weeklyQuestionLimit,
      questionsRemainingThisWeek:
        weeklyQuestionLimit === null
          ? null
          : Math.max(weeklyQuestionLimit - questionsUsedThisWeek, 0),
      insightsUsedThisWeek,
      weeklyInsightLimit,
      insightsRemainingThisWeek:
        weeklyInsightLimit === null ? null : Math.max(weeklyInsightLimit - insightsUsedThisWeek, 0),
      dailyInsightLimitPerChild,
      childrenUsed,
      childrenLimit,
      weekStart,
      weekEnd
    };
  },

  async assertCanCreateChild(userId: string) {
    const plan = await this.getUserPlan(userId);
    const childrenLimit = this.getChildLimit(plan);
    const childrenUsed = await prisma.childProfile.count({
      where: { userId }
    });

    if (childrenUsed >= childrenLimit) {
      throw new AppError(getPlanLimitErrorMessage(plan), 403, {
        code: 'CHILD_LIMIT_REACHED',
        childrenUsed,
        childrenLimit
      });
    }
  },

  async assertCanGenerateQuestions(userId: string, questionCount: number) {
    const usage = await this.getUsageStatus(userId);

    if (usage.weeklyQuestionLimit !== null) {
      const projectedQuestions = usage.questionsUsedThisWeek + questionCount;

      if (projectedQuestions > usage.weeklyQuestionLimit) {
        throw new AppError('Weekly question generation limit reached.', 429, {
          code: 'QUESTION_LIMIT_REACHED',
          questionsUsedThisWeek: usage.questionsUsedThisWeek,
          weeklyQuestionLimit: usage.weeklyQuestionLimit,
          questionsRemainingThisWeek: usage.questionsRemainingThisWeek
        });
      }
    }

    return usage;
  },

  async assertCanGenerateAIInsight(userId: string, childId: string) {
    const plan = await this.getUserPlan(userId);

    if (plan === 'FREE') {
      const { weekStart, nextWeekStart } = this.getCurrentWeekRange();
      const insightsUsedThisWeek = await prisma.usageEvent.aggregate({
        where: {
          userId,
          eventType: UsageEventType.AI_INSIGHT_GENERATION,
          createdAt: {
            gte: weekStart,
            lt: nextWeekStart
          }
        },
        _sum: { count: true }
      });

      if ((insightsUsedThisWeek._sum.count ?? 0) >= FREE_WEEKLY_INSIGHT_LIMIT) {
        throw new AppError(
          'Free plan includes 1 AI insight per week. Upgrade to Premium for daily insights.',
          429,
          { code: 'AI_INSIGHT_WEEKLY_LIMIT_REACHED' }
        );
      }

      return;
    }

    const { dayStart, nextDayStart } = this.getCurrentDayRange();
    const insightsUsedTodayForChild = await prisma.usageEvent.aggregate({
      where: {
        userId,
        childId,
        eventType: UsageEventType.AI_INSIGHT_GENERATION,
        createdAt: {
          gte: dayStart,
          lt: nextDayStart
        }
      },
      _sum: { count: true }
    });

    if ((insightsUsedTodayForChild._sum.count ?? 0) >= PREMIUM_DAILY_INSIGHT_LIMIT_PER_CHILD) {
      throw new AppError(
        'AI insight already generated for this child today. Please try again tomorrow.',
        429,
        { code: 'AI_INSIGHT_DAILY_LIMIT_REACHED' }
      );
    }
  },

  recordQuestionGeneration(userId: string, questionCount: number) {
    return prisma.usageEvent.create({
      data: {
        userId,
        eventType: UsageEventType.QUESTION_GENERATION,
        count: questionCount
      }
    });
  },

  recordAIInsightGeneration(userId: string, childId: string) {
    return prisma.usageEvent.create({
      data: {
        userId,
        childId,
        eventType: UsageEventType.AI_INSIGHT_GENERATION,
        count: 1
      }
    });
  }
};
