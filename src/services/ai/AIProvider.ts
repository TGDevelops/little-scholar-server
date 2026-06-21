import type {
  GeneratedExam,
  ResolvedGenerateExamInput
} from '../../validators/exam.validator';
import type {
  GenerateAnalyticsInsightInput,
  GeneratedAnalyticsInsight
} from '../../validators/analytics.validator';
import type { ExamBlueprint } from '../examBlueprintService';

export type AIUsage = {
  tokensUsed: number;
  inputTokens: number;
  outputTokens: number;
};

export type GenerateExamResult = {
  exam: GeneratedExam;
  usage: AIUsage;
};

export type GenerateAnalyticsInsightResult = {
  insight: GeneratedAnalyticsInsight;
  usage: AIUsage;
};

export interface AIProvider {
  readonly name: string;
  generateExam(
    input: ResolvedGenerateExamInput,
    blueprint: ExamBlueprint
  ): Promise<GenerateExamResult>;
  generateAnalyticsInsight(
    input: GenerateAnalyticsInsightInput
  ): Promise<GenerateAnalyticsInsightResult>;
}
