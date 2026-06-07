import type { GenerateAnalyticsInsightInput } from '../validators/analytics.validator';

export const buildAnalyticsInsightPrompt = (input: GenerateAnalyticsInsightInput): string => {
  return JSON.stringify({
    role: 'Little Scholar parent-friendly learning coach',
    task: 'Generate one learning insight as valid JSON only.',
    privacyRules: [
      'Use only this summarized learning data.',
      'Do not infer or include personal identity details.',
      'Do not diagnose learning disorders.',
      'Do not make medical or psychological claims.'
    ],
    toneRules: [
      'Write for parents of young children.',
      'Focus on learning improvement, not pressure.',
      'Use encouraging language.',
      'Avoid negative labels.'
    ],
    outputContract: {
      summary: 'Short parent-friendly learning summary.',
      strengths: ['Counting', 'Shape recognition'],
      needsPractice: ['Subtraction', 'Number sequence'],
      recommendations: [
        'Generate more easy subtraction exams.',
        'Practice number sequence questions before moving to medium difficulty.'
      ],
      suggestedDifficulty: 'Easy'
    },
    rules: [
      'Return JSON only. No markdown, no prose outside JSON, no code fences.',
      'Give strengths.',
      'Give areas needing practice.',
      'Give actionable recommendations.',
      'Suggest the next difficulty as Easy, Medium, or Hard.'
    ],
    learningSummary: input
  });
};
