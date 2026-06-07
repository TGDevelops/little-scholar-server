import { z } from 'zod';
import { difficultySchema, gradeSchema, subjectSchema } from './exam.validator';

const topicSchema = z.string().trim().min(1).max(80);

export const createExamAttemptSchema = z
  .object({
    body: z
      .object({
        childId: z.string().uuid(),
        examId: z.string().trim().min(1).max(120).optional(),
        grade: gradeSchema.optional(),
        subject: subjectSchema,
        difficulty: difficultySchema,
        questionCount: z.number().int().min(1).max(200),
        correctAnswers: z.number().int().min(0).max(200),
        totalMarks: z.number().int().positive().max(1_000).optional(),
        earnedMarks: z.number().int().min(0).max(1_000).optional(),
        scorePercentage: z.number().min(0).max(100).optional(),
        timeSpentSeconds: z.number().int().min(0).max(86_400).optional(),
        answers: z.unknown().optional(),
        strongTopics: z.array(topicSchema).max(50).optional(),
        weakTopics: z.array(topicSchema).max(50).optional(),
        attemptedAt: z.string().datetime().optional()
      })
      .strict()
  })
  .superRefine((value, ctx) => {
    const { correctAnswers, earnedMarks, questionCount, totalMarks } = value.body;

    if (correctAnswers > questionCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['body', 'correctAnswers'],
        message: 'correctAnswers cannot exceed questionCount'
      });
    }

    if (earnedMarks !== undefined && totalMarks !== undefined && earnedMarks > totalMarks) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['body', 'earnedMarks'],
        message: 'earnedMarks cannot exceed totalMarks'
      });
    }
  });

export const childExamAttemptsParamsSchema = z.object({
  params: z
    .object({
      childId: z.string().uuid()
    })
    .strict()
});

export type CreateExamAttemptInput = z.infer<typeof createExamAttemptSchema>['body'];
export type ChildExamAttemptsParams = z.infer<
  typeof childExamAttemptsParamsSchema
>['params'];
