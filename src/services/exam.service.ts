import { OperationType, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/prisma';
import { createAIProvider } from './ai';
import { childService } from './child.service';
import { usageService } from './usage.service';
import { buildExamGenerationPrompt } from '../prompts/examGenerationPrompt';
import { AppError } from '../utils/AppError';
import type {
  GenerateChildExamInput,
  ListChildExamsQuery,
  ResolvedGenerateExamInput,
  SubmitGeneratedExamAttemptInput
} from '../validators/exam.validator';

const aiProvider = createAIProvider();

const generatedExamPaperSelect = {
  id: true,
  userId: true,
  childId: true,
  grade: true,
  subject: true,
  difficulty: true,
  questionCount: true,
  questions: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  deletedAt: true
} as const;

const examAttemptSelect = {
  id: true,
  userId: true,
  childId: true,
  examId: true,
  grade: true,
  subject: true,
  difficulty: true,
  questionCount: true,
  correctAnswers: true,
  totalMarks: true,
  earnedMarks: true,
  scorePercentage: true,
  timeSpentSeconds: true,
  answers: true,
  strongTopics: true,
  weakTopics: true,
  attemptedAt: true,
  createdAt: true,
  updatedAt: true
} as const;

export const examService = {
  async generateChildExam(userId: string, childId: string, input: GenerateChildExamInput) {
    const child = await childService.assertChildBelongsToUser(userId, childId);

    const resolvedInput: ResolvedGenerateExamInput = {
      childId,
      grade: child.grade as ResolvedGenerateExamInput['grade'],
      subject: input.subject,
      difficulty: input.difficulty,
      questionCount: input.questionCount
    };
    const { result, usage } = await generateWithUsage(userId, resolvedInput);

    const paper = await prisma.generatedExamPaper.create({
      data: {
        id: result.exam.examId,
        userId,
        childId,
        grade: result.exam.grade,
        subject: result.exam.subject,
        difficulty: result.exam.difficulty,
        questionCount: result.exam.questionCount,
        questions: result.exam.questions as Prisma.InputJsonValue,
        status: 'pending'
      },
      select: generatedExamPaperSelect
    });

    return {
      ...toSavedExamPaperResponse(paper),
      usage: {
        tokensUsed: result.usage.tokensUsed,
        remainingTokens: usage.remainingTokens,
        monthlyLimit: usage.monthlyLimit
      }
    };
  },

  async listChildExams(userId: string, childId: string, query: ListChildExamsQuery) {
    await childService.assertChildBelongsToUser(userId, childId);

    const papers = await prisma.generatedExamPaper.findMany({
      where: {
        userId,
        childId,
        status: query.status
      },
      orderBy: { createdAt: 'desc' },
      select: generatedExamPaperSelect
    });

    return papers.map(toSavedExamPaperResponse);
  },

  async submitGeneratedExamAttempt(
    userId: string,
    examId: string,
    input: SubmitGeneratedExamAttemptInput
  ) {
    const result = await prisma.$transaction(async (tx) => {
      const paper = await tx.generatedExamPaper.findFirst({
        where: { id: examId, userId },
        select: generatedExamPaperSelect
      });

      if (!paper) {
        throw new AppError('Generated exam paper not found', 404);
      }

      if (paper.status !== 'pending') {
        throw new AppError('Generated exam paper is not pending', 409);
      }

      if (input.correctAnswers > paper.questionCount) {
        throw new AppError('correctAnswers cannot exceed questionCount', 400);
      }

      const attempt = await tx.examAttempt.create({
        data: {
          userId,
          childId: paper.childId,
          examId: paper.id,
          grade: paper.grade,
          subject: paper.subject,
          difficulty: paper.difficulty,
          questionCount: paper.questionCount,
          correctAnswers: input.correctAnswers,
          totalMarks: input.totalMarks,
          earnedMarks: input.earnedMarks,
          scorePercentage: calculateScorePercentage(paper.questionCount, input),
          timeSpentSeconds: input.timeSpentSeconds,
          answers: toJsonInput(input.answers),
          strongTopics: input.strongTopics ?? [],
          weakTopics: input.weakTopics ?? [],
          attemptedAt: input.attemptedAt ? new Date(input.attemptedAt) : undefined
        },
        select: examAttemptSelect
      });

      const completedPaper = await tx.generatedExamPaper.update({
        where: { id: paper.id },
        data: {
          status: 'completed',
          completedAt: new Date()
        },
        select: generatedExamPaperSelect
      });

      return { exam: completedPaper, attempt };
    });

    return {
      exam: toSavedExamPaperResponse(result.exam),
      attempt: result.attempt
    };
  }
};

const generateWithUsage = async (userId: string, resolvedInput: ResolvedGenerateExamInput) => {
  const estimatedPrompt = buildExamGenerationPrompt(resolvedInput, uuidv4());
  const estimatedTokens =
    usageService.estimateTokensFromText(estimatedPrompt) + resolvedInput.questionCount * 90;

  await usageService.assertWithinTokenLimit(userId, estimatedTokens);

  const result = await aiProvider.generateExam(resolvedInput);

  await usageService.recordUsage(
    userId,
    aiProvider.name,
    OperationType.EXAM_GENERATION,
    result.usage.inputTokens,
    result.usage.outputTokens
  );

  const usage = await usageService.getRemainingTokens(userId);

  return { result, usage };
};

const toSavedExamPaperResponse = (paper: {
  id: string;
  userId: string;
  childId: string;
  grade: string;
  subject: string;
  difficulty: string;
  questionCount: number;
  questions: Prisma.JsonValue;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  deletedAt: Date | null;
}) => ({
  examId: paper.id,
  userId: paper.userId,
  childId: paper.childId,
  grade: paper.grade,
  subject: paper.subject,
  difficulty: paper.difficulty,
  questionCount: paper.questionCount,
  questions: paper.questions,
  status: paper.status,
  createdAt: paper.createdAt,
  updatedAt: paper.updatedAt,
  completedAt: paper.completedAt,
  deletedAt: paper.deletedAt
});

const toJsonInput = (value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
};

const calculateScorePercentage = (
  questionCount: number,
  input: SubmitGeneratedExamAttemptInput
): number => {
  if (input.scorePercentage !== undefined) {
    return input.scorePercentage;
  }

  if (input.totalMarks && input.earnedMarks !== undefined) {
    return Math.round((input.earnedMarks / input.totalMarks) * 10_000) / 100;
  }

  return Math.round((input.correctAnswers / questionCount) * 10_000) / 100;
};
