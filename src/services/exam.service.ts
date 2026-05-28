import { createAIProvider } from './ai';
import { usageService } from './usage.service';
import type { GenerateExamInput } from '../validators/exam.validator';

const aiProvider = createAIProvider();

export const examService = {
  async generateExam(userId: string, input: GenerateExamInput) {
    const result = await aiProvider.generateExam(input);

    await usageService.logUsage({
      userId,
      provider: aiProvider.name,
      tokensUsed: result.usage.tokensUsed,
      operationType: 'exam_generation'
    });

    return result.exam;
  }
};
