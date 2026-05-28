import { GoogleGenerativeAI, type GenerateContentResult } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { buildExamGenerationPrompt } from '../../prompts/examGenerationPrompt';
import { generatedExamSchema, type GenerateExamInput } from '../../validators/exam.validator';
import type { AIProvider, GenerateExamResult } from './AIProvider';

export class GeminiProvider implements AIProvider {
  public readonly name = 'gemini';
  private readonly model;

  constructor() {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.5
      }
    });
  }

  async generateExam(input: GenerateExamInput): Promise<GenerateExamResult> {
    const examId = uuidv4();
    const prompt = buildExamGenerationPrompt(input, examId);
    const result = await this.model.generateContent(prompt);
    const rawText = result.response.text();
    const parsedJson = this.parseJson(rawText);
    const exam = generatedExamSchema.parse(parsedJson);

    if (
      exam.examId !== examId ||
      exam.grade !== input.grade ||
      exam.subject !== input.subject ||
      exam.difficulty !== input.difficulty ||
      exam.questionCount !== input.questionCount ||
      exam.questions.length !== input.questionCount
    ) {
      throw new AppError('AI response did not match the requested exam contract', 502);
    }

    return {
      exam,
      usage: {
        tokensUsed: this.getTokensUsed(result)
      }
    };
  }

  private parseJson(rawText: string): unknown {
    try {
      return JSON.parse(rawText);
    } catch {
      throw new AppError('AI provider returned invalid JSON', 502);
    }
  }

  private getTokensUsed(result: GenerateContentResult): number {
    const usageMetadata = result.response.usageMetadata;
    return usageMetadata?.totalTokenCount ?? 0;
  }
}
