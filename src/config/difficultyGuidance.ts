import type { Difficulty } from '../validators/exam.validator';
import type { LearningStage } from './supportedGrades';

export const difficultyGuidance: Record<LearningStage, Record<Difficulty, string[]>> = {
  FOUNDATIONAL: {
    Easy: [
      'Single-step recognition or recall.',
      'Very short questions.',
      'Minimal reading.',
      'Small number range.',
      'Use visual support where helpful.'
    ],
    Medium: [
      'One reasoning step.',
      'Slightly larger number range.',
      'Simple comparison, sequence, or classification.',
      'Short sentence questions.'
    ],
    Hard: [
      'Two reasoning steps where grade-appropriate.',
      'Slightly more independence.',
      'Still age-appropriate.',
      'Avoid advanced topics outside syllabus.'
    ]
  },
  PREPARATORY: {
    Easy: [
      'Direct concept recall.',
      'Single-step questions.',
      'Basic comprehension.'
    ],
    Medium: [
      'One to two reasoning steps.',
      'Simple word problems.',
      'Concept application.'
    ],
    Hard: [
      'Multi-step reasoning.',
      'Application-based questions.',
      'Word problems.',
      'Inference-based comprehension.',
      'Still limited strictly to the grade syllabus.'
    ]
  }
};
