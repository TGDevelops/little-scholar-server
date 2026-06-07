import { OperationType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { createAIProvider } from './ai';
import { childService } from './child.service';
import { usageService } from './usage.service';
import { buildExamGenerationPrompt } from '../prompts/examGenerationPrompt';
import { AppError } from '../utils/AppError';
import type { GenerateExamInput, ResolvedGenerateExamInput } from '../validators/exam.validator';

const aiProvider = createAIProvider();

export const examService = {
  async generateExam(userId: string, input: GenerateExamInput) {
    const resolvedInput = await resolveExamInput(userId, input);
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

    return {
      ...(input.childId ? { childId: input.childId } : {}),
      ...result.exam,
      usage: {
        tokensUsed: result.usage.tokensUsed,
        remainingTokens: usage.remainingTokens,
        monthlyLimit: usage.monthlyLimit
      }
    };
  }
};

const resolveExamInput = async (
  userId: string,
  input: GenerateExamInput
): Promise<ResolvedGenerateExamInput> => {
  if (!input.childId) {
    return {
      ...input,
      grade: input.grade as ResolvedGenerateExamInput['grade']
    };
  }

  const child = await childService.assertChildBelongsToUser(userId, input.childId);

  if (input.grade && input.grade !== child.grade) {
    throw new AppError('Provided grade does not match the selected child profile', 400);
  }

  return {
    childId: input.childId,
    grade: child.grade as ResolvedGenerateExamInput['grade'],
    subject: input.subject,
    difficulty: input.difficulty,
    questionCount: input.questionCount
  };
};
