import assert from 'node:assert/strict';
import { examBlueprintService } from '../src/services/examBlueprintService';
import { examValidationService } from '../src/services/examValidationService';
import { AppError } from '../src/utils/AppError';
import {
  generatedQuestionSchema,
  type GeneratedExam,
  type GeneratedQuestion
} from '../src/validators/exam.validator';

const buildValidQuestion = (
  partial: Partial<GeneratedQuestion> & Pick<GeneratedQuestion, 'type' | 'topic'>
): GeneratedQuestion => {
  const base: GeneratedQuestion = {
    id: 'q1',
    type: partial.type,
    question: 'Choose the correct answer.',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'A',
    acceptableAnswers: ['A'],
    explanation: 'A is correct.',
    topic: partial.topic,
    learningObjective: `Practice ${partial.topic}`,
    difficultyLevel: 'Easy',
    marks: 1
  };

  return { ...base, ...partial };
};

const nurseryBlueprint = examBlueprintService.createBlueprint({
  grade: 'Nursery',
  subject: 'Maths',
  difficulty: 'Easy',
  questionCount: 5
});

assert.deepEqual(nurseryBlueprint.allowedQuestionTypes, [
  'picture_identification',
  'count_and_answer',
  'shape_recognition',
  'color_recognition',
  'odd_one_out',
  'compare_objects'
]);

const gradeOneHardMaths = examBlueprintService.createBlueprint({
  grade: 'Grade 1',
  subject: 'Maths',
  difficulty: 'Hard',
  questionCount: 5
});

assert(!gradeOneHardMaths.allowedConcepts.includes('Multiplication basics'));
assert(!gradeOneHardMaths.allowedConcepts.includes('Division basics'));
assert(!gradeOneHardMaths.allowedConcepts.includes('Fractions introduction'));

const gradeFiveHardMaths = examBlueprintService.createBlueprint({
  grade: 'Grade 5',
  subject: 'Maths',
  difficulty: 'Hard',
  questionCount: 5
});

assert(gradeFiveHardMaths.allowedQuestionTypes.includes('word_problem'));
assert(!gradeFiveHardMaths.allowedConcepts.some((concept) => /algebra/i.test(concept)));

const ukgEnglish = examBlueprintService.createBlueprint({
  grade: 'UKG',
  subject: 'English',
  difficulty: 'Medium',
  questionCount: 5
});

assert(!ukgEnglish.allowedQuestionTypes.includes('reading_comprehension'));

const topic = gradeOneHardMaths.selectedConcepts[0];
const validQuestions = Object.entries(gradeOneHardMaths.questionTypeDistribution).flatMap(
  ([type, count], index) =>
    Array.from({ length: count }, (_, offset) =>
      buildValidQuestion({
        id: `q${index}-${offset}`,
        type: type as GeneratedQuestion['type'],
        topic,
        question:
          type === 'reading_comprehension'
            ? "Riya has a red bag. What color is Riya's bag?"
            : 'Riya has 9 crayons and gets 6 more. How many crayons does she have now?',
        passage: type === 'reading_comprehension' ? 'Riya has a red bag.' : undefined,
        leftItems: type === 'match_following' ? ['2 + 3'] : undefined,
        rightItems: type === 'match_following' ? ['5'] : undefined,
        correctAnswer:
          type === 'match_following'
            ? { '2 + 3': '5' }
            : type === 'sequence_ordering'
              ? ['9', '11', '14', '16']
              : '15',
        options:
          type === 'true_false'
            ? ['True', 'False']
            : type === 'mcq'
              ? ['13', '14', '15', '16']
              : type === 'sequence_ordering'
                ? ['16', '9', '14', '11']
                : undefined
      })
    )
);

const validExam: GeneratedExam = {
  examId: '00000000-0000-0000-0000-000000000001',
  grade: 'Grade 1',
  subject: 'Maths',
  difficulty: 'Hard',
  questionCount: validQuestions.length,
  questions: validQuestions
};

assert.equal(examValidationService.validate(validExam, gradeOneHardMaths).valid, true);

const invalidTopicExam: GeneratedExam = {
  ...validExam,
  questions: [
    {
      ...validExam.questions[0],
      topic: 'Multiplication basics'
    },
    ...validExam.questions.slice(1)
  ]
};

assert.equal(examValidationService.validate(invalidTopicExam, gradeOneHardMaths).valid, false);

const normalizedSequenceQuestion = generatedQuestionSchema.parse({
  id: 'q-normalized-sequence',
  type: 'sequence_ordering',
  question: 'Put the numbers from smallest to largest.',
  options: [20, 30, 10, 40],
  correctAnswer: [10, 20, 30, 40],
  passage: '',
  acceptableAnswers: [],
  explanation: 'The correct order is 10, 20, 30, 40.',
  topic,
  learningObjective: 'Arrange numbers in order.',
  difficultyLevel: 'Hard',
  marks: 1
});

assert.deepEqual(normalizedSequenceQuestion.options, ['20', '30', '10', '40']);
assert.deepEqual(normalizedSequenceQuestion.correctAnswer, ['10', '20', '30', '40']);
assert.equal(normalizedSequenceQuestion.passage, undefined);

assert.throws(
  () =>
    examBlueprintService.createBlueprint({
      grade: 'Nursery',
      subject: 'Hindi',
      difficulty: 'Easy',
      questionCount: 5
    }),
  AppError
);

console.log('Exam engine smoke tests passed');
