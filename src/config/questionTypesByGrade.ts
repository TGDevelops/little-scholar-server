import type { SupportedGrade } from './supportedGrades';

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
  'word_problem',
  'reading_comprehension',
  'categorization',
  'application_based',
  'reasoning_question'
] as const;

export type QuestionType = (typeof questionTypes)[number];

export const questionTypesByGrade: Record<SupportedGrade, QuestionType[]> = {
  Nursery: [
    'picture_identification',
    'count_and_answer',
    'shape_recognition',
    'color_recognition',
    'odd_one_out',
    'compare_objects'
  ],
  LKG: [
    'picture_mcq',
    'count_and_answer',
    'missing_number',
    'odd_one_out',
    'simple_match',
    'simple_true_false'
  ],
  UKG: [
    'mcq',
    'true_false',
    'fill_blank',
    'match_following',
    'missing_number',
    'pattern_recognition',
    'sequence_ordering'
  ],
  'Grade 1': [
    'mcq',
    'true_false',
    'fill_blank',
    'match_following',
    'sequence_ordering',
    'short_answer',
    'reading_comprehension',
    'categorization'
  ],
  'Grade 2': [
    'mcq',
    'true_false',
    'fill_blank',
    'match_following',
    'short_answer',
    'word_problem',
    'reading_comprehension',
    'categorization',
    'sequence_ordering'
  ],
  'Grade 3': [
    'mcq',
    'true_false',
    'fill_blank',
    'match_following',
    'short_answer',
    'word_problem',
    'reading_comprehension',
    'application_based',
    'categorization'
  ],
  'Grade 4': [
    'mcq',
    'true_false',
    'fill_blank',
    'match_following',
    'short_answer',
    'word_problem',
    'reading_comprehension',
    'application_based',
    'reasoning_question'
  ],
  'Grade 5': [
    'mcq',
    'true_false',
    'fill_blank',
    'match_following',
    'short_answer',
    'word_problem',
    'reading_comprehension',
    'application_based',
    'reasoning_question'
  ]
};
