import { v4 as uuidv4 } from 'uuid';
import type {
  AIProvider,
  GenerateAnalyticsInsightResult,
  GenerateExamResult
} from './AIProvider';
import type { GenerateExamInput, GeneratedExam, GeneratedQuestion } from '../../validators/exam.validator';
import type { GenerateAnalyticsInsightInput } from '../../validators/analytics.validator';

export class MockProvider implements AIProvider {
  public readonly name = 'mock';

  async generateExam(input: GenerateExamInput): Promise<GenerateExamResult> {
    const examId = uuidv4();

    const question = (i: number): GeneratedQuestion => ({
      id: uuidv4(),
      type: 'mcq',
      question: `Sample question ${i + 1} for ${input.subject}`,
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      acceptableAnswers: ['A'],
      explanation: 'This is a mocked explanation.',
      topic: 'Mock Topic',
      marks: 1
    });

    const exam: GeneratedExam = {
      examId,
      grade: input.grade,
      subject: input.subject,
      difficulty: input.difficulty,
      questionCount: input.questionCount,
      questions: Array.from({ length: input.questionCount }, (_, i) => question(i))
    };

    return {
      exam,
      usage: {
        tokensUsed: 100,
        inputTokens: 50,
        outputTokens: 50
      }
    };
  }

  async generateAnalyticsInsight(
    input: GenerateAnalyticsInsightInput
  ): Promise<GenerateAnalyticsInsightResult> {
    const firstSubject = input.summary.subjects[0];

    return {
      insight: {
        summary: 'Your child is making steady progress and is ready for gentle practice.',
        strengths: firstSubject?.strongTopics.slice(0, 2) ?? ['Consistent practice'],
        needsPractice: firstSubject?.weakTopics.slice(0, 2) ?? ['Mixed revision'],
        recommendations: [
          'Generate a short easy exam for the topic that needs practice.',
          'Review one topic at a time before increasing difficulty.'
        ],
        suggestedDifficulty: input.summary.averageScore >= 80 ? 'Medium' : 'Easy'
      },
      usage: {
        tokensUsed: 120,
        inputTokens: 70,
        outputTokens: 50
      }
    };
  }
}

export default MockProvider;
