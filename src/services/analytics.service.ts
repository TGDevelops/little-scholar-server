import { OperationType, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { createAIProvider } from './ai';
import { planQuotaService } from './planQuotaService';
import { performanceService } from './performance.service';
import { usageService } from './usage.service';
import {
  aiAnalyticsInsightInputSchema,
  type GenerateAnalyticsForChildInput
} from '../validators/analytics.validator';

const aiProvider = createAIProvider();

const aiInsightSelect = {
  id: true,
  userId: true,
  childId: true,
  period: true,
  summary: true,
  strengths: true,
  needsPractice: true,
  recommendations: true,
  suggestedDifficulty: true,
  metadata: true,
  createdAt: true
} as const;

export const analyticsService = {
  async generateInsight(userId: string, input: GenerateAnalyticsForChildInput) {
    const performance = await performanceService.getChildPerformance(
      userId,
      input.childId,
      input.period
    );
    const aiInput = aiAnalyticsInsightInputSchema.parse({
      child: {
        age: performance.child.age,
        grade: performance.child.grade
      },
      period: input.period,
      summary: {
        totalExams: performance.summary.totalExams,
        averageScore: performance.summary.averageScore,
        bestScore: performance.summary.bestScore,
        subjects: performance.summary.subjects,
        recentTrend: performance.summary.recentTrend
      }
    });

    await planQuotaService.assertCanGenerateAIInsight(userId, input.childId);

    const result = await aiProvider.generateAnalyticsInsight(aiInput);

    await usageService.recordUsage(
      userId,
      aiProvider.name,
      OperationType.AI_INSIGHT_GENERATION,
      result.usage.inputTokens,
      result.usage.outputTokens
    );

    const insight = await prisma.aIInsight.create({
      data: {
        userId,
        childId: input.childId,
        period: input.period,
        summary: result.insight.summary,
        strengths: result.insight.strengths,
        needsPractice: result.insight.needsPractice,
        recommendations: result.insight.recommendations,
        suggestedDifficulty: result.insight.suggestedDifficulty,
        metadata: {
          performance: performance.summary,
          usage: result.usage
        } as Prisma.InputJsonObject
      },
      select: aiInsightSelect
    });

    await planQuotaService.recordAIInsightGeneration(userId, input.childId);

    return insight;
  },

  async listInsightsForChild(userId: string, childId: string) {
    await performanceService.getChildPerformance(userId, childId);

    return prisma.aIInsight.findMany({
      where: { userId, childId },
      orderBy: { createdAt: 'desc' },
      select: aiInsightSelect
    });
  }
};
