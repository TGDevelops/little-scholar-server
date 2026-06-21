import {
  getGradeQuestionConfig,
  getQuestionTypeDistribution
} from '../config/gradeQuestionConfig';
import type { ResolvedGenerateExamInput } from '../validators/exam.validator';

export const buildExamGenerationPrompt = (
  input: ResolvedGenerateExamInput,
  examId: string
): string => {
  const gradeConfig = getGradeQuestionConfig(input.grade);
  const questionTypeDistribution = getQuestionTypeDistribution(
    input.grade,
    input.questionCount
  );

  return JSON.stringify({
    role: 'Little Scholar exam paper generator',
    task: `Generate one developmentally appropriate ${input.grade} exam paper as valid JSON only.`,
    gradeFramework: {
      grade: input.grade,
      learningGoals: gradeConfig.learningGoals,
      allowedQuestionTypes: gradeConfig.allowedQuestionTypes,
      questionTypeDistribution,
      developmentalRules: gradeConfig.rules,
      difficulty: input.difficulty,
      difficultyGuidance: gradeConfig.difficultyGuidance[input.difficulty]
    },
    qualityBar: {
      instruction:
        'Difficulty must change the reasoning demand, number range, and independence required. Do not only reuse easier questions with a Hard label.',
      subjectSpecificRules:
        input.grade === 'Grade 1' && input.subject === 'Maths' && input.difficulty === 'Hard'
          ? [
              'Generate Hard Grade 1 Maths questions that still stay within Grade 1 concepts.',
              'Prefer word problems, missing addends, compare expressions, sequence ordering, and addition/subtraction within 20.',
              'Avoid trivial number-comparison questions such as "Is 10 greater than 5?"',
              'A true/false question, if used, must test reasoning such as an equation, expression comparison, or short word situation.',
              'Each question should require at least one reasoning step beyond recognizing a number.'
            ]
          : []
    },
    outputContract: {
      examId,
      grade: input.grade,
      subject: input.subject,
      difficulty: input.difficulty,
      questionCount: input.questionCount,
      questions: [
        {
          id: 'q1',
          type: 'One of the allowedQuestionTypes for this grade only.',
          question: 'Question text',
          visualElements: [
            'Required for visual question types such as picture_identification, count_and_answer, color_recognition, shape_recognition, odd_one_out, compare_objects, picture_mcq, and pattern_recognition.'
          ],
          options: [
            'Required for mcq, picture_mcq, true_false, and simple_true_false. Do not use for match_following or simple_match.'
          ],
          leftItems: [
            'Required only for match_following and simple_match. Items shown in the left column.'
          ],
          rightItems: [
            'Required only for match_following and simple_match. Shuffled items shown in the right column.'
          ],
          passage: 'Required only for reading_comprehension. Use one very short passage.',
          categories: ['Required only for categorization. Category names shown by the app.'],
          correctAnswer:
            'Correct answer. For match_following/simple_match, return an object mapping left items to right items. For categorization, return an object mapping category names to item arrays.',
          acceptableAnswers: ['Alternative spellings or word forms when useful.'],
          explanation: 'Short child-friendly explanation.',
          topic: 'Topic name',
          marks: 1
        }
      ]
    },
    rules: [
      'Return JSON only. No markdown, no prose outside JSON, no code fences.',
      'Generate exactly questionCount questions.',
      'Use only the allowedQuestionTypes listed in gradeFramework.',
      'Follow the questionTypeDistribution counts exactly unless impossible for the requested subject.',
      'Follow gradeFramework.difficultyGuidance for every question.',
      'Reject internally and rewrite any question that is too easy for the requested grade and difficulty.',
      'Every question must include id, type, question, correctAnswer, explanation, topic, and marks.',
      'Every mcq and picture_mcq question must include 4 options and exactly one correct option.',
      'Every true_false and simple_true_false question must include options ["True", "False"].',
      'Every match_following and simple_match question must include leftItems and rightItems arrays with the same length.',
      'For match_following and simple_match, rightItems must be shuffled and correctAnswer must map each left item to its matching right item.',
      'For Nursery and LKG visual question types, use visualElements with simple emoji or short visual labels.',
      'For reading_comprehension, include a passage field with one short child-friendly passage.',
      'For categorization, include categories and map each category to item arrays in correctAnswer.',
      'The exam must include correct answers so an iOS app can evaluate locally.',
      'Questions must be age appropriate for Nursery, LKG, UKG, or Grade 1.',
      'Questions must be CBSE foundational-stage friendly.',
      'Avoid adult, violent, scary, political, religious, sensitive, discriminatory, or unsafe content.',
      'Use simple language suitable for early learners.',
      'Do not include personal data or references to real children.'
    ],
    requestedExam: input
  });
};
