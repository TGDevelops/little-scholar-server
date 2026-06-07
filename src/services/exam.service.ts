import { OperationType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { createAIProvider } from './ai';
import { usageService } from './usage.service';
import { buildExamGenerationPrompt } from '../prompts/examGenerationPrompt';
import type { GenerateExamInput } from '../validators/exam.validator';

const aiProvider = createAIProvider();

export const examService = {
  async generateExam(userId: string, input: GenerateExamInput) {
    const estimatedPrompt = buildExamGenerationPrompt(input, uuidv4());
    const estimatedTokens =
      usageService.estimateTokensFromText(estimatedPrompt) + input.questionCount * 90;

    await usageService.assertWithinTokenLimit(userId, estimatedTokens);

    const result = await aiProvider.generateExam(input);

    await usageService.recordUsage(
      userId,
      aiProvider.name,
      OperationType.EXAM_GENERATION,
      result.usage.inputTokens,
      result.usage.outputTokens
    );

    const usage = await usageService.getRemainingTokens(userId);

    return {
      ...result.exam,
      usage: {
        tokensUsed: result.usage.tokensUsed,
        remainingTokens: usage.remainingTokens,
        monthlyLimit: usage.monthlyLimit
      }
    };
  }
};
