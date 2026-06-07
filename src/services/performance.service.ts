import type { ExamAttempt } from '@prisma/client';
import { prisma } from '../config/prisma';
import { childService } from './child.service';
import type { AnalyticsPeriod } from '../validators/analytics.validator';

type AttemptForSummary = Pick<
  ExamAttempt,
  | 'subject'
  | 'scorePercentage'
  | 'strongTopics'
  | 'weakTopics'
  | 'attemptedAt'
  | 'questionCount'
  | 'correctAnswers'
>;

const getPeriodStart = (period: AnalyticsPeriod): Date | undefined => {
  const now = new Date();

  if (period === 'last_30_days') {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  if (period === 'current_month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return undefined;
};

const average = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
};

const topTopics = (attempts: AttemptForSummary[], key: 'strongTopics' | 'weakTopics') => {
  const counts = new Map<string, number>();

  for (const attempt of attempts) {
    for (const topic of attempt[key]) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([topic]) => topic);
};

export const performanceService = {
  async getChildPerformance(userId: string, childId: string, period: AnalyticsPeriod = 'all_time') {
    const child = await childService.assertChildBelongsToUser(userId, childId);
    const periodStart = getPeriodStart(period);

    const attempts = await prisma.examAttempt.findMany({
      where: {
        userId,
        childId,
        ...(periodStart ? { attemptedAt: { gte: periodStart } } : {})
      },
      orderBy: { attemptedAt: 'desc' },
      select: {
        subject: true,
        scorePercentage: true,
        strongTopics: true,
        weakTopics: true,
        attemptedAt: true,
        questionCount: true,
        correctAnswers: true
      }
    });

    const totalExams = attempts.length;
    const scores = attempts.map((attempt) => attempt.scorePercentage);
    const subjects = [...new Set(attempts.map((attempt) => attempt.subject))].map((subject) => {
      const subjectAttempts = attempts.filter((attempt) => attempt.subject === subject);

      return {
        subject,
        averageScore: average(subjectAttempts.map((attempt) => attempt.scorePercentage)),
        totalExams: subjectAttempts.length,
        strongTopics: topTopics(subjectAttempts, 'strongTopics'),
        weakTopics: topTopics(subjectAttempts, 'weakTopics')
      };
    });

    return {
      child,
      period,
      summary: {
        totalExams,
        averageScore: average(scores),
        bestScore: scores.length > 0 ? Math.max(...scores) : 0,
        totalQuestions: attempts.reduce((sum, attempt) => sum + attempt.questionCount, 0),
        correctAnswers: attempts.reduce((sum, attempt) => sum + attempt.correctAnswers, 0),
        subjects,
        recentTrend: attempts.slice(0, 20).map((attempt) => ({
          subject: attempt.subject,
          percentage: attempt.scorePercentage,
          attemptedAt: attempt.attemptedAt.toISOString()
        }))
      }
    };
  }
};
