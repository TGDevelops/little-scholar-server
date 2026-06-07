import { z } from 'zod';
import { difficultySchema, gradeSchema, subjectSchema } from './exam.validator';

const topicSchema = z.string().trim().min(1).max(80);

const subjectSummarySchema = z
  .object({
    subject: subjectSchema,
    averageScore: z.number().min(0).max(100),
    totalExams: z.number().int().min(0).max(10_000),
    strongTopics: z.array(topicSchema).max(20),
    weakTopics: z.array(topicSchema).max(20)
  })
  .strict();

const recentTrendSchema = z
  .object({
    subject: subjectSchema,
    percentage: z.number().min(0).max(100),
    attemptedAt: z.string().datetime()
  })
  .strict();

export const analyticsPeriodSchema = z.enum(['all_time', 'current_month', 'last_30_days']);

export const generateAnalyticsForChildSchema = z.object({
  body: z
    .object({
      childId: z.string().uuid(),
      period: analyticsPeriodSchema.default('last_30_days')
    })
    .strict()
});

export const childAnalyticsParamsSchema = z.object({
  params: z
    .object({
      childId: z.string().uuid()
    })
    .strict()
});

export const aiAnalyticsInsightInputSchema = z
  .object({
    child: z
      .object({
        age: z.number().int().min(2).max(10),
        grade: gradeSchema
      })
      .strict(),
    period: analyticsPeriodSchema,
    summary: z
      .object({
        totalExams: z.number().int().min(0).max(10_000),
        averageScore: z.number().min(0).max(100),
        bestScore: z.number().min(0).max(100),
        subjects: z.array(subjectSummarySchema).max(10),
        recentTrend: z.array(recentTrendSchema).max(20)
      })
      .strict()
  })
  .strict();

export const generatedAnalyticsInsightSchema = z
  .object({
    summary: z.string().trim().min(1).max(1_000),
    strengths: z.array(topicSchema).max(20),
    needsPractice: z.array(topicSchema).max(20),
    recommendations: z.array(z.string().trim().min(1).max(240)).min(1).max(10),
    suggestedDifficulty: difficultySchema
  })
  .strict();

export type GenerateAnalyticsForChildInput = z.infer<
  typeof generateAnalyticsForChildSchema
>['body'];
export type ChildAnalyticsParams = z.infer<typeof childAnalyticsParamsSchema>['params'];
export type AnalyticsPeriod = z.infer<typeof analyticsPeriodSchema>;
export type GenerateAnalyticsInsightInput = z.infer<typeof aiAnalyticsInsightInputSchema>;
export type GeneratedAnalyticsInsight = z.infer<typeof generatedAnalyticsInsightSchema>;
