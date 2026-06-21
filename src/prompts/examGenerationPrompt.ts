import type { ExamBlueprint } from '../services/examBlueprintService';
import type { ResolvedGenerateExamInput } from '../validators/exam.validator';

export const buildExamGenerationPrompt = (
  input: ResolvedGenerateExamInput,
  examId: string,
  blueprint: ExamBlueprint
): string => {
  return JSON.stringify({
    role: 'Little Scholar exam paper generator',
    task: `Generate one developmentally appropriate ${input.grade} exam paper as valid JSON only.`,
    grade: input.grade,
    subject: input.subject,
    difficulty: input.difficulty,
    learningStage: blueprint.learningStage,
    selectedConcepts: blueprint.selectedConcepts,
    allowedQuestionTypes: blueprint.allowedQuestionTypes,
    questionTypeDistribution: blueprint.questionTypeDistribution,
    difficultyGuidance: blueprint.difficultyGuidance,
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
            'Required for mcq, picture_mcq, true_false, simple_true_false, missing_number, and sequence_ordering. For sequence_ordering, options are shuffled items to arrange.'
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
          topic: 'Must exactly match one selectedConcept.',
          learningObjective: 'Specific learning objective directly related to topic.',
          difficultyLevel: 'Easy | Medium | Hard. Must match requested difficulty.',
          marks: 1
        }
      ]
    },
    rules: [
      'Return JSON only. No markdown, no prose outside JSON, no code fences.',
      'Generate exactly questionCount questions.',
      'Generate questions only from selectedConcepts.',
      'Do not use concepts outside selectedConcepts.',
      'If a concept is not listed, do not generate a question from it.',
      'Every question topic must exactly match one selectedConcept.',
      'Every learningObjective must be directly related to the topic.',
      'Every question type must be one of allowedQuestionTypes.',
      'Follow questionTypeDistribution exactly.',
      'Follow difficultyGuidance for every question.',
      'Reject internally and rewrite any question that is too easy for the requested grade and difficulty.',
      'Every question must include id, type, question, correctAnswer, explanation, topic, learningObjective, difficultyLevel, and marks.',
      'Every mcq and picture_mcq question must include 4 options and exactly one correct option.',
      'Every true_false and simple_true_false question must include options ["True", "False"].',
      'Every missing_number question must include answer choices in options.',
      'Every sequence_ordering question must include shuffled items in options and correctAnswer must be the ordered array of those items.',
      'Every match_following and simple_match question must include leftItems and rightItems arrays with the same length.',
      'For match_following and simple_match, rightItems must be shuffled and correctAnswer must map each left item to its matching right item.',
      'For Nursery and LKG visual question types, use visualElements with simple emoji or short visual labels.',
      'For reading_comprehension, include a passage field with one short child-friendly passage.',
      'For categorization, include categories and map each category to item arrays in correctAnswer.',
      'For word_problem, include a short real-life scenario.',
      'For reasoning_question, require reasoning but remain within selectedConcepts.',
      'For application_based, apply a known selectedConcept to a simple situation.',
      'The exam must include correct answers so an iOS app can evaluate locally.',
      'Questions must be age appropriate for Nursery through Grade 5.',
      'Questions must be CBSE foundational-stage friendly.',
      'Avoid adult, violent, scary, political, religious, sensitive, discriminatory, or unsafe content.',
      'Use simple language suitable for early learners.',
      'Do not include personal data or references to real children.'
    ],
    requestedExam: input
  });
};
