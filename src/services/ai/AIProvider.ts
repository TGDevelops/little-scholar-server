import type { GenerateExamInput, GeneratedExam } from '../../validators/exam.validator';

export type AIUsage = {
  tokensUsed: number;
};

export type GenerateExamResult = {
  exam: GeneratedExam;
  usage: AIUsage;
};

export interface AIProvider {
  readonly name: string;
  generateExam(input: GenerateExamInput): Promise<GenerateExamResult>;
}
