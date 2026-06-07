import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { childService } from './child.service';
import type { CreateExamAttemptInput } from '../validators/examAttempt.validator';

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

const toJsonInput = (
  value: unknown
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
};

const calculateScorePercentage = (input: CreateExamAttemptInput): number => {
  if (input.scorePercentage !== undefined) {
    return input.scorePercentage;
  }

  if (input.totalMarks && input.earnedMarks !== undefined) {
    return Math.round((input.earnedMarks / input.totalMarks) * 10_000) / 100;
  }

  return Math.round((input.correctAnswers / input.questionCount) * 10_000) / 100;
};

export const examAttemptService = {
  async createAttempt(userId: string, input: CreateExamAttemptInput) {
    const child = await childService.assertChildBelongsToUser(userId, input.childId);

    return prisma.examAttempt.create({
      data: {
        userId,
        childId: input.childId,
        examId: input.examId,
        grade: input.grade ?? child.grade,
        subject: input.subject,
        difficulty: input.difficulty,
        questionCount: input.questionCount,
        correctAnswers: input.correctAnswers,
        totalMarks: input.totalMarks,
        earnedMarks: input.earnedMarks,
        scorePercentage: calculateScorePercentage(input),
        timeSpentSeconds: input.timeSpentSeconds,
        answers: toJsonInput(input.answers),
        strongTopics: input.strongTopics ?? [],
        weakTopics: input.weakTopics ?? [],
        attemptedAt: input.attemptedAt ? new Date(input.attemptedAt) : undefined
      },
      select: examAttemptSelect
    });
  },

  async listAttemptsForChild(userId: string, childId: string) {
    await childService.assertChildBelongsToUser(userId, childId);

    return prisma.examAttempt.findMany({
      where: { userId, childId },
      orderBy: { attemptedAt: 'desc' },
      select: examAttemptSelect
    });
  }
};
