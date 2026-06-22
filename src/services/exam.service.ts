import { OperationType, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { createAIProvider } from './ai';
import { childService } from './child.service';
import { examBlueprintService } from './examBlueprintService';
import { examValidationService } from './examValidationService';
import { planQuotaService } from './planQuotaService';
import { usageService } from './usage.service';
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
    const blueprint = examBlueprintService.createBlueprint(resolvedInput);
    const { result } = await generateWithUsage(userId, resolvedInput, blueprint);

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

    await planQuotaService.recordQuestionGeneration(userId, result.exam.questionCount);

    return {
      ...toSavedExamPaperResponse(paper)
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

const generateWithUsage = async (
  userId: string,
  resolvedInput: ResolvedGenerateExamInput,
  blueprint: ReturnType<typeof examBlueprintService.createBlueprint>
) => {
  await planQuotaService.assertCanGenerateQuestions(userId, resolvedInput.questionCount);

  let lastValidationReasons: string[] = [];
  let result: Awaited<ReturnType<typeof aiProvider.generateExam>> | undefined;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      result = await aiProvider.generateExam(resolvedInput, blueprint);
      const validation = examValidationService.validate(result.exam, blueprint);

      if (validation.valid) {
        console.info('Exam generation validation passed', {
          grade: resolvedInput.grade,
          subject: resolvedInput.subject,
          difficulty: resolvedInput.difficulty,
          selectedConcepts: blueprint.selectedConcepts,
          questionTypeDistribution: blueprint.questionTypeDistribution,
          attempt
        });
        break;
      }

      lastValidationReasons = validation.reasons;
      console.warn('Exam generation validation failed', {
        grade: resolvedInput.grade,
        subject: resolvedInput.subject,
        difficulty: resolvedInput.difficulty,
        selectedConcepts: blueprint.selectedConcepts,
        questionTypeDistribution: blueprint.questionTypeDistribution,
        reasons: validation.reasons,
        attempt
      });
    } catch (error) {
      if (
        error instanceof AppError &&
        error.details &&
        typeof error.details === 'object' &&
        'reason' in error.details
      ) {
        throw error;
      }

      const reason = error instanceof Error ? error.message : 'Unknown generation error';
      lastValidationReasons = [reason];
      console.warn('Exam generation attempt failed', {
        grade: resolvedInput.grade,
        subject: resolvedInput.subject,
        difficulty: resolvedInput.difficulty,
        selectedConcepts: blueprint.selectedConcepts,
        questionTypeDistribution: blueprint.questionTypeDistribution,
        reason,
        attempt
      });
    }
  }

  if (!result || !examValidationService.validate(result.exam, blueprint).valid) {
    throw new AppError('Unable to generate a syllabus-aligned exam at this time. Please try again.', 502, {
      code: 'SYLLABUS_ALIGNED_EXAM_GENERATION_FAILED',
      reasons: lastValidationReasons
    });
  }

  await usageService.recordUsage(
    userId,
    aiProvider.name,
    OperationType.EXAM_GENERATION,
    result.usage.inputTokens,
    result.usage.outputTokens
  );

  return { result };
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
