import type { z } from 'zod';
import type { gradeSchema } from '../validators/exam.validator';

export type Grade = z.infer<typeof gradeSchema>;
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export const questionTypes = [
  'picture_identification',
  'count_and_answer',
  'shape_recognition',
  'color_recognition',
  'odd_one_out',
  'compare_objects',
  'picture_mcq',
  'missing_number',
  'simple_match',
  'simple_true_false',
  'mcq',
  'true_false',
  'fill_blank',
  'match_following',
  'pattern_recognition',
  'sequence_ordering',
  'short_answer',
  'reading_comprehension',
  'categorization'
] as const;

export type QuestionType = (typeof questionTypes)[number];

type GradeQuestionConfig = {
  learningGoals: string[];
  allowedQuestionTypes: QuestionType[];
  rules: string[];
  difficultyGuidance: Record<Difficulty, string[]>;
};

export const gradeQuestionConfig: Record<Grade, GradeQuestionConfig> = {
  Nursery: {
    learningGoals: [
      'Visual recognition',
      'Object identification',
      'Shape recognition',
      'Color recognition',
      'Counting up to 5',
      'Basic comparison',
      'Attention and observation'
    ],
    allowedQuestionTypes: [
      'picture_identification',
      'count_and_answer',
      'shape_recognition',
      'color_recognition',
      'odd_one_out',
      'compare_objects'
    ],
    rules: [
      'Use extremely short questions.',
      'Use visual elements wherever possible.',
      'Avoid reading-heavy questions.',
      'Avoid text entry.',
      'Do not generate match-the-following, fill-in-the-blank, long MCQ, or true/false questions.'
    ],
    difficultyGuidance: {
      Easy: [
        'Use direct visual recognition with 1-step observation.',
        'Use counting up to 3.',
        'Use very familiar objects, colors, and shapes.'
      ],
      Medium: [
        'Use counting up to 5.',
        'Ask the child to identify a different object, bigger object, or simple shape.',
        'Keep every question answerable by looking, not reading.'
      ],
      Hard: [
        'Use two visual attributes together, such as color plus object or size plus object.',
        'Use counting up to 5 with mixed objects.',
        'Ask simple observation questions, not text-heavy reasoning.'
      ]
    }
  },
  LKG: {
    learningGoals: [
      'Number recognition',
      'Alphabet recognition',
      'Basic reasoning',
      'Early classification',
      'Counting up to 10'
    ],
    allowedQuestionTypes: [
      'picture_mcq',
      'count_and_answer',
      'missing_number',
      'odd_one_out',
      'simple_match',
      'simple_true_false'
    ],
    rules: [
      'Keep language simple.',
      'Prefer visual questions where possible.',
      'Avoid long reading passages.',
      'Avoid open-ended text answers.'
    ],
    difficultyGuidance: {
      Easy: [
        'Use recognition tasks for numbers, letters, colors, shapes, and familiar objects.',
        'Use counting up to 5.',
        'Use one-step questions with picture support.'
      ],
      Medium: [
        'Use counting up to 10.',
        'Use missing numbers in short sequences.',
        'Use simple classification and matching with familiar objects.'
      ],
      Hard: [
        'Use missing numbers up to 10, simple odd-one-out reasoning, and alphabet-object matching.',
        'Use simple true/false only with obvious real-world facts.',
        'Avoid open-ended writing.'
      ]
    }
  },
  UKG: {
    learningGoals: [
      'Reading readiness',
      'Number operations',
      'Pattern recognition',
      'Logical thinking',
      'Sequencing'
    ],
    allowedQuestionTypes: [
      'mcq',
      'true_false',
      'fill_blank',
      'match_following',
      'missing_number',
      'pattern_recognition',
      'sequence_ordering'
    ],
    rules: [
      'Mix visual and text questions.',
      'Keep questions short.',
      'Focus on understanding rather than memorization.'
    ],
    difficultyGuidance: {
      Easy: [
        'Use direct recognition, counting, and one-step number or letter patterns.',
        'Use small numbers and short prompts.'
      ],
      Medium: [
        'Use addition or subtraction within 10, missing numbers, and simple repeating patterns.',
        'Use match-the-following for familiar word-object or number-quantity relationships.'
      ],
      Hard: [
        'Use addition/subtraction within 20, missing addends, short sequence reasoning, and non-trivial patterns.',
        'Require one small reasoning step beyond recognition.',
        'Avoid questions that only ask an obvious comparison of two numbers.'
      ]
    }
  },
  'Grade 1': {
    learningGoals: [
      'Reading comprehension',
      'Problem solving',
      'Independent thinking',
      'Basic reasoning',
      'Subject mastery'
    ],
    allowedQuestionTypes: [
      'mcq',
      'true_false',
      'fill_blank',
      'match_following',
      'sequence_ordering',
      'short_answer',
      'reading_comprehension',
      'categorization'
    ],
    rules: [
      'Encourage reasoning.',
      'Introduce simple comprehension.',
      'Allow limited text responses.'
    ],
    difficultyGuidance: {
      Easy: [
        'Use one-step questions with addition/subtraction within 10, simple vocabulary, and direct recall.',
        'Use short answer only for familiar facts.'
      ],
      Medium: [
        'Use addition/subtraction within 20, missing numbers, ordering, and short word problems.',
        'Use simple comprehension or categorization with familiar contexts.'
      ],
      Hard: [
        'Use Grade 1 appropriate multi-step thinking, not Grade 2 content.',
        'For Maths, prefer word problems, missing addends, compare expressions, sequence ordering, and addition/subtraction within 20.',
        'For Maths, avoid trivial comparisons like "Is 10 greater than 5?" unless embedded in a richer reasoning problem.',
        'Require reasoning such as choosing the correct operation, finding an unknown, ordering values, or interpreting a short situation.'
      ]
    }
  }
};

export const getGradeQuestionConfig = (grade: Grade) => gradeQuestionConfig[grade];

export const getQuestionTypeDistribution = (
  grade: Grade,
  questionCount: number
): Record<QuestionType, number> => {
  const allowedTypes = getGradeQuestionConfig(grade).allowedQuestionTypes;
  const distribution = Object.fromEntries(
    allowedTypes.map((questionType) => [questionType, 0])
  ) as Record<QuestionType, number>;

  for (let index = 0; index < questionCount; index += 1) {
    distribution[allowedTypes[index % allowedTypes.length]] += 1;
  }

  return distribution;
};

export const isQuestionTypeAllowedForGrade = (grade: Grade, questionType: QuestionType) =>
  getGradeQuestionConfig(grade).allowedQuestionTypes.includes(questionType);
