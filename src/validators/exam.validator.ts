import { z } from 'zod';

export const gradeSchema = z.enum(['Nursery', 'LKG', 'UKG', 'Grade 1']);
export const subjectSchema = z.enum(['English', 'Maths', 'Hindi', 'EVS', 'GK']);
export const difficultySchema = z.enum(['Easy', 'Medium', 'Hard']);
export const questionTypeSchema = z.enum(['mcq', 'true_false', 'fill_blank']);

export const generateExamSchema = z
  .object({
    body: z
      .object({
        childId: z.string().uuid().optional(),
        grade: gradeSchema.optional(),
        subject: subjectSchema,
        difficulty: difficultySchema,
        questionCount: z.number().int().min(1).max(25)
      })
      .strict()
  })
  .superRefine((value, ctx) => {
    if (!value.body.childId && !value.body.grade) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['body', 'childId'],
        message: 'childId is required when grade is not provided'
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

export type GenerateExamInput = z.infer<typeof generateExamSchema>['body'];
export type ResolvedGenerateExamInput = Omit<GenerateExamInput, 'grade'> & {
  grade: z.infer<typeof gradeSchema>;
};
export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
export type GeneratedExam = z.infer<typeof generatedExamSchema>;
