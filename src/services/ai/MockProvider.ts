import { v4 as uuidv4 } from 'uuid';
import { getGradeQuestionConfig } from '../../config/gradeQuestionConfig';
import type {
  AIProvider,
  GenerateAnalyticsInsightResult,
  GenerateExamResult
} from './AIProvider';
import type {
  GeneratedExam,
  GeneratedQuestion,
  ResolvedGenerateExamInput
} from '../../validators/exam.validator';
import type { GenerateAnalyticsInsightInput } from '../../validators/analytics.validator';

export class MockProvider implements AIProvider {
  public readonly name = 'mock';

  async generateExam(input: ResolvedGenerateExamInput): Promise<GenerateExamResult> {
    const examId = uuidv4();
    const allowedTypes = getGradeQuestionConfig(input.grade).allowedQuestionTypes;
    const useHardGradeOneMath =
      input.grade === 'Grade 1' && input.subject === 'Maths' && input.difficulty === 'Hard';

    const question = (i: number): GeneratedQuestion => {
      const type = allowedTypes[i % allowedTypes.length];
      const baseQuestion = {
        id: uuidv4(),
        type,
        question: `Sample question ${i + 1} for ${input.subject}`,
        correctAnswer: 'A',
        acceptableAnswers: ['A'],
        explanation: 'This is a mocked explanation.',
        topic: 'Mock Topic',
        marks: 1
      };

      if (useHardGradeOneMath) {
        if (type === 'mcq') {
          return {
            ...baseQuestion,
            question: 'Riya has 9 crayons. She gets 6 more. How many crayons does she have now?',
            options: ['13', '14', '15', '16'],
            correctAnswer: '15',
            acceptableAnswers: ['15', 'fifteen']
          };
        }

        if (type === 'true_false') {
          return {
            ...baseQuestion,
            question: '8 + 7 is the same as 10 + 5.',
            options: ['True', 'False'],
            correctAnswer: 'True'
          };
        }

        if (type === 'fill_blank') {
          return {
            ...baseQuestion,
            question: '12 + __ = 18',
            correctAnswer: '6',
            acceptableAnswers: ['6', 'six']
          };
        }

        if (type === 'sequence_ordering') {
          return {
            ...baseQuestion,
            question: 'Put these numbers from smallest to biggest.',
            options: ['16', '9', '14', '11'],
            correctAnswer: ['9', '11', '14', '16']
          };
        }

        if (type === 'short_answer') {
          return {
            ...baseQuestion,
            question: 'A box has 13 pencils. 5 are used. How many pencils are left?',
            correctAnswer: '8',
            acceptableAnswers: ['8', 'eight']
          };
        }
      }

      if (type === 'match_following' || type === 'simple_match') {
        return {
          ...baseQuestion,
          question: 'Match the following.',
          leftItems: ['A', 'B'],
          rightItems: ['Ball', 'Apple'],
          correctAnswer: {
            A: 'Apple',
            B: 'Ball'
          },
          marks: 2
        };
      }

      if (type === 'true_false' || type === 'simple_true_false') {
        return {
          ...baseQuestion,
          question: 'A fish can fly.',
          options: ['True', 'False'],
          correctAnswer: 'False'
        };
      }

      if (type === 'reading_comprehension') {
        return {
          ...baseQuestion,
          passage: 'Tom has a red ball.',
          question: "What color is Tom's ball?",
          correctAnswer: 'red',
          acceptableAnswers: ['red']
        };
      }

      if (type === 'categorization') {
        return {
          ...baseQuestion,
          question: 'Group the items.',
          visualElements: ['Cat', 'Rose'],
          categories: ['Animals', 'Plants'],
          correctAnswer: {
            Animals: ['Cat'],
            Plants: ['Rose']
          },
          marks: 2
        };
      }

      if (
        [
          'picture_identification',
          'count_and_answer',
          'shape_recognition',
          'color_recognition',
          'odd_one_out',
          'compare_objects',
          'picture_mcq',
          'pattern_recognition'
        ].includes(type)
      ) {
        return {
          ...baseQuestion,
          visualElements: ['🐶', '🐱', '🐘', '🐟'],
          options: type === 'picture_mcq' ? ['Dog', 'Cat', 'Elephant', 'Fish'] : undefined,
          correctAnswer: type === 'picture_mcq' ? 'Dog' : '🐶'
        };
      }

      return {
        ...baseQuestion,
        options: type === 'mcq' ? ['A', 'B', 'C', 'D'] : undefined
      };
    };

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
