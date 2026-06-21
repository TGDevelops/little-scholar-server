import { z } from 'zod';
import {
  isQuestionTypeAllowedForGrade,
  questionTypes,
  type QuestionType
} from '../config/gradeQuestionConfig';
import { supportedGrades } from '../config/supportedGrades';

export const gradeSchema = z.enum(supportedGrades);
export type Grade = z.infer<typeof gradeSchema>;
export const subjectSchema = z.enum(['English', 'Maths', 'Hindi', 'EVS', 'GK']);
export type Subject = z.infer<typeof subjectSchema>;
export const difficultySchema = z.enum(['Easy', 'Medium', 'Hard']);
export type Difficulty = z.infer<typeof difficultySchema>;
export const questionTypeSchema = z.enum(questionTypes);
export const examPaperStatusSchema = z.enum(['pending', 'completed', 'deleted']);

const topicSchema = z.string().trim().min(1).max(80);
const correctAnswerSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.record(z.union([z.string(), z.array(z.string())]))
]);
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
    visualElements: z.array(z.string().min(1)).optional(),
    leftItems: z.array(z.string().min(1)).optional(),
    rightItems: z.array(z.string().min(1)).optional(),
    passage: z.string().min(1).optional(),
    categories: z.array(z.string().min(1)).optional(),
    correctAnswer: correctAnswerSchema,
    acceptableAnswers: z.array(z.string()).optional(),
    explanation: z.string().min(1),
    topic: z.string().min(1),
    learningObjective: z.string().min(1),
    difficultyLevel: difficultySchema,
    marks: z.number().int().positive()
  })
  .superRefine((question, ctx) => {
    const fourOptionTypes: QuestionType[] = ['mcq', 'picture_mcq'];
    const trueFalseTypes: QuestionType[] = ['true_false', 'simple_true_false'];
    const matchTypes: QuestionType[] = ['match_following', 'simple_match'];
    const visualTypes: QuestionType[] = [
      'picture_identification',
      'count_and_answer',
      'shape_recognition',
      'color_recognition',
      'odd_one_out',
      'compare_objects',
      'picture_mcq',
      'pattern_recognition'
    ];
    const scenarioTypes: QuestionType[] = [
      'word_problem',
      'application_based',
      'reasoning_question'
    ];

    if (fourOptionTypes.includes(question.type) && question.options?.length !== 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'MCQ questions must include exactly 4 options'
      });
    }

    if (
      trueFalseTypes.includes(question.type) &&
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

    if (matchTypes.includes(question.type)) {
      if (!question.leftItems?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['leftItems'],
          message: 'Match-the-following questions must include leftItems'
        });
      }

      if (!question.rightItems?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rightItems'],
          message: 'Match-the-following questions must include rightItems'
        });
      }

      if (
        question.leftItems?.length &&
        question.rightItems?.length &&
        question.leftItems.length !== question.rightItems.length
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rightItems'],
          message: 'Match-the-following questions must include the same number of leftItems and rightItems'
        });
      }

      if (
        typeof question.correctAnswer !== 'object' ||
        Array.isArray(question.correctAnswer)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['correctAnswer'],
          message: 'Match-the-following correctAnswer must map left items to right items'
        });
      } else if (
        Object.values(question.correctAnswer).some((answer) => Array.isArray(answer))
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['correctAnswer'],
          message: 'Match-the-following correctAnswer values must be strings'
        });
      }
    }

    if (visualTypes.includes(question.type) && !question.visualElements?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['visualElements'],
        message: 'Visual question types must include visualElements'
      });
    }

    if (question.type === 'reading_comprehension' && !question.passage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['passage'],
        message: 'Reading comprehension questions must include a short passage'
      });
    }

    if (
      scenarioTypes.includes(question.type) &&
      question.question.trim().split(/\s+/).length < 8
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['question'],
        message: `${question.type} questions must include a short real-life or reasoning scenario`
      });
    }

    if (question.type === 'categorization') {
      if (!question.categories || question.categories.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['categories'],
          message: 'Categorization questions must include at least two categories'
        });
      }

      if (
        typeof question.correctAnswer !== 'object' ||
        Array.isArray(question.correctAnswer)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['correctAnswer'],
          message: 'Categorization correctAnswer must map categories to item arrays'
        });
      } else if (
        Object.values(question.correctAnswer).some((answer) => !Array.isArray(answer))
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['correctAnswer'],
          message: 'Categorization correctAnswer values must be item arrays'
        });
      }
    }
  });

export const generatedExamSchema = z
  .object({
    examId: z.string().uuid(),
    grade: gradeSchema,
    subject: subjectSchema,
    difficulty: difficultySchema,
    questionCount: z.number().int().positive(),
    questions: z.array(generatedQuestionSchema).min(1)
  })
  .superRefine((exam, ctx) => {
    exam.questions.forEach((question, index) => {
      if (!isQuestionTypeAllowedForGrade(exam.grade, question.type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['questions', index, 'type'],
          message: `${question.type} is not allowed for ${exam.grade}`
        });
      }
    });
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
