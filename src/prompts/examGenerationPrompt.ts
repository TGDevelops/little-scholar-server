import type { GenerateExamInput } from '../validators/exam.validator';

export const buildExamGenerationPrompt = (input: GenerateExamInput, examId: string): string => {
  return JSON.stringify({
    role: 'Little Scholar exam paper generator',
    task: 'Generate one exam paper as valid JSON only.',
    outputContract: {
      examId,
      grade: input.grade,
      subject: input.subject,
      difficulty: input.difficulty,
      questionCount: input.questionCount,
      questions: [
        {
          id: 'q1',
          type: 'mcq | true_false | fill_blank | match_following',
          question: 'Question text',
          options: ['Required for mcq and true_false. Optional for other types.'],
          correctAnswer:
            'Correct answer. For match_following, return an object mapping left items to right items.',
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
      'Supported question types: mcq, true_false, fill_blank, match_following.',
      'Every question must include id, type, question, correctAnswer, explanation, topic, and marks.',
      'Every mcq question must include 4 options and exactly one correct option.',
      'Every true_false question must include options ["True", "False"].',
      'The exam must include correct answers so an iOS app can evaluate locally.',
      'Questions must be age appropriate for LKG, UKG, or Grade 1.',
      'Questions must be CBSE foundational-stage friendly.',
      'Avoid adult, violent, scary, political, religious, sensitive, discriminatory, or unsafe content.',
      'Use simple language suitable for early learners.',
      'Do not include personal data or references to real children.'
    ],
    requestedExam: input
  });
};
