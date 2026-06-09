import { z } from 'zod';

export const gradeSchema = z.enum(['Nursery', 'LKG', 'UKG', 'Grade 1']);
export const subjectSchema = z.enum(['English', 'Maths', 'Hindi', 'EVS', 'GK']);
export const difficultySchema = z.enum(['Easy', 'Medium', 'Hard']);
export const questionTypeSchema = z.enum([
  'mcq',
  'true_false',
  'fill_blank',
  'match_following'
]);
export const examPaperStatusSchema = z.enum(['pending', 'completed', 'deleted']);

const topicSchema = z.string().trim().min(1).max(80);
const childIdParamsSchema = z
  .object({
    childId: z.string().uuid()
  })
  .strict();

const examIdParamsSchema = z
  .object({
    examId: z.string().uuid()
  })
  .strict();

export const generateChildExamSchema = z.object({
  params: childIdParamsSchema,
  body: z
    .object({
      subject: subjectSchema,
      difficulty: difficultySchema,
      questionCount: z.number().int().min(1).max(25)
    })
    .strict()
});

export const listChildExamsSchema = z.object({
  params: childIdParamsSchema,
  query: z
    .object({
      status: examPaperStatusSchema.default('pending')
    })
    .strict()
});

export const submitGeneratedExamAttemptSchema = z
  .object({
    params: examIdParamsSchema,
    body: z
      .object({
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
    const { earnedMarks, totalMarks } = value.body;

    if (earnedMarks !== undefined && totalMarks !== undefined && earnedMarks > totalMarks) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['body', 'earnedMarks'],
        message: 'earnedMarks cannot exceed totalMarks'
      });
    }
  });

export const generatedQuestionSchema = z
  .object({
    id: z.string().min(1),
    type: questionTypeSchema,
    question: z.string().min(1),
    options: z.array(z.string()).optional(),
    correctAnswer: z.union([z.string(), z.array(z.string()), z.record(z.string())]),
    acceptableAnswers: z.array(z.string()).optional(),
    explanation: z.string().min(1),
    topic: z.string().min(1),
    marks: z.number().int().positive()
  })
  .superRefine((question, ctx) => {
    if (question.type === 'mcq' && question.options?.length !== 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'MCQ questions must include exactly 4 options'
      });
    }

    if (
      question.type === 'true_false' &&
      (question.options?.length !== 2 ||
        !question.options.includes('True') ||
        !question.options.includes('False'))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'True/false questions must include options ["True", "False"]'
      });
    }
  });

export const generatedExamSchema = z.object({
  examId: z.string().uuid(),
  grade: gradeSchema,
  subject: subjectSchema,
  difficulty: difficultySchema,
  questionCount: z.number().int().positive(),
  questions: z.array(generatedQuestionSchema).min(1)
});

export type GenerateChildExamInput = z.infer<typeof generateChildExamSchema>['body'];
export type ChildExamParams = z.infer<typeof generateChildExamSchema>['params'];
export type ListChildExamsQuery = z.infer<typeof listChildExamsSchema>['query'];
export type SubmitGeneratedExamAttemptInput = z.infer<
  typeof submitGeneratedExamAttemptSchema
>['body'];
export type ExamIdParams = z.infer<typeof submitGeneratedExamAttemptSchema>['params'];
export type ResolvedGenerateExamInput = GenerateChildExamInput & {
  childId: string;
  grade: z.infer<typeof gradeSchema>;
};
export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
export type GeneratedExam = z.infer<typeof generatedExamSchema>;
