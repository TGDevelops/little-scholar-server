import { v4 as uuidv4 } from 'uuid';
import type { AIProvider, GenerateExamResult } from './AIProvider';
import type { GenerateExamInput, GeneratedExam, GeneratedQuestion } from '../../validators/exam.validator';

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
        tokensUsed: 0
      }
    };
  }
}

export default MockProvider;
