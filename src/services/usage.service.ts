import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import type { OperationType, PlanType, User } from '@prisma/client';

const MONTHLY_LIMITS: Record<PlanType, number> = {
  FREE: 10_000,
  PREMIUM: 100_000
};

const getCurrentMonthRange = (now = new Date()) => {
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextPeriodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const periodEnd = new Date(nextPeriodStart.getTime() - 1);

  return { periodStart, nextPeriodStart, periodEnd };
};

const estimateTokensFromText = (text: string): number => Math.ceil(text.length / 4);

export const usageService = {
  getCurrentMonthRange,

  estimateTokensFromText,

  async getMonthlyUsage(userId: string) {
    const { periodStart, nextPeriodStart, periodEnd } = getCurrentMonthRange();

    const aggregate = await prisma.usageLog.aggregate({
      where: {
        userId,
        createdAt: {
          gte: periodStart,
          lt: nextPeriodStart
        }
      },
      _sum: {
        tokensUsed: true
      }
    });

    return {
      tokensUsed: aggregate._sum.tokensUsed ?? 0,
      periodStart,
      periodEnd
    };
  },

  getMonthlyLimit(user: Pick<User, 'plan'>) {
    return MONTHLY_LIMITS[user.plan];
  },

  async getRemainingTokens(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true }
    });

    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    const monthlyUsage = await this.getMonthlyUsage(userId);
    const monthlyLimit = this.getMonthlyLimit(user);
    const remainingTokens = Math.max(monthlyLimit - monthlyUsage.tokensUsed, 0);

    return {
      plan: user.plan,
      monthlyLimit,
      tokensUsed: monthlyUsage.tokensUsed,
      remainingTokens,
      periodStart: monthlyUsage.periodStart,
      periodEnd: monthlyUsage.periodEnd
    };
  },

  async assertWithinTokenLimit(userId: string, estimatedTokens: number) {
    const usage = await this.getRemainingTokens(userId);

    if (estimatedTokens > usage.remainingTokens) {
      throw new AppError('Monthly AI usage limit reached.', 429, {
        monthlyLimit: usage.monthlyLimit,
        tokensUsed: usage.tokensUsed,
        remainingTokens: usage.remainingTokens
      });
    }

    return usage;
  },

  async recordUsage(
    userId: string,
    provider: string,
    operationType: OperationType,
    inputTokens: number,
    outputTokens: number
  ) {
    const tokensUsed = inputTokens + outputTokens;

    return prisma.usageLog.create({
      data: {
        userId,
        provider,
        operationType,
        inputTokens,
        outputTokens,
        tokensUsed
      }
    });
  },

  async logUsage(input: {
    userId: string;
    provider: string;
    tokensUsed: number;
    operationType: OperationType;
    inputTokens?: number;
    outputTokens?: number;
  }) {
    return prisma.usageLog.create({
      data: {
        ...input,
        inputTokens: input.inputTokens ?? 0,
        outputTokens: input.outputTokens ?? input.tokensUsed
      }
    });
  }
};
