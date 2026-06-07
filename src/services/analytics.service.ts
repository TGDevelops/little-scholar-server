import { Prisma } from '@prisma/client';
import { OperationType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { createAIProvider } from './ai';
import { performanceService } from './performance.service';
import { usageService } from './usage.service';
import { buildAnalyticsInsightPrompt } from '../prompts/analyticsInsightPrompt';
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

    const prompt = buildAnalyticsInsightPrompt(aiInput);
    const estimatedTokens = usageService.estimateTokensFromText(prompt) + 600;

    await usageService.assertWithinTokenLimit(userId, estimatedTokens);

    const result = await aiProvider.generateAnalyticsInsight(aiInput);

    await usageService.recordUsage(
      userId,
      aiProvider.name,
      OperationType.AI_INSIGHT_GENERATION,
      result.usage.inputTokens,
      result.usage.outputTokens
    );

    const usage = await usageService.getRemainingTokens(userId);
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

    return {
      ...insight,
      usage: {
        tokensUsed: result.usage.tokensUsed,
        remainingTokens: usage.remainingTokens,
        monthlyLimit: usage.monthlyLimit
      }
    };
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
