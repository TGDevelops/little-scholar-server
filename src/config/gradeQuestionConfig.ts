import { difficultyGuidance } from './difficultyGuidance';
import { questionTypes, questionTypesByGrade, type QuestionType } from './questionTypesByGrade';
import { getLearningStage, type SupportedGrade } from './supportedGrades';

export { questionTypes, type QuestionType };

type GradeQuestionConfig = {
  learningGoals: string[];
  allowedQuestionTypes: QuestionType[];
  rules: string[];
  difficultyGuidance: Record<'Easy' | 'Medium' | 'Hard', string[]>;
};

const learningGoalsByGrade: Record<SupportedGrade, string[]> = {
  Nursery: [
    'Visual recognition',
    'Object identification',
    'Shape recognition',
    'Color recognition',
    'Counting up to 5',
    'Attention and observation'
  ],
  LKG: [
    'Number recognition',
    'Alphabet recognition',
    'Basic reasoning',
    'Early classification',
    'Counting up to 10'
  ],
  UKG: [
    'Reading readiness',
    'Number operations',
    'Pattern recognition',
    'Logical thinking',
    'Sequencing'
  ],
  'Grade 1': [
    'Reading comprehension',
    'Problem solving',
    'Independent thinking',
    'Basic reasoning',
    'Subject mastery'
  ],
  'Grade 2': [
    'Fluency with early arithmetic',
    'Reading comprehension',
    'Sentence formation',
    'Observation and classification',
    'Early data interpretation'
  ],
  'Grade 3': [
    'Concept application',
    'Word problem solving',
    'Reading comprehension',
    'Grammar foundations',
    'Environmental awareness'
  ],
  'Grade 4': [
    'Multi-step problem solving',
    'Inference and reasoning',
    'Vocabulary and grammar',
    'Measurement and geometry',
    'Environment and science awareness'
  ],
  'Grade 5': [
    'Independent reasoning',
    'Application-based problem solving',
    'Paragraph understanding',
    'Data handling',
    'Preparatory-stage subject mastery'
  ]
};

const rulesByStage = {
  FOUNDATIONAL: [
    'Keep questions short and developmentally appropriate.',
    'Use visual support where useful.',
    'Avoid advanced topics outside the selected syllabus concepts.'
  ],
  PREPARATORY: [
    'Prefer concept application where appropriate.',
    'Use clear grade-level language.',
    'Stay strictly within selected syllabus concepts.'
  ]
} as const;

export const gradeQuestionConfig: Record<SupportedGrade, GradeQuestionConfig> =
  Object.fromEntries(
    Object.entries(questionTypesByGrade).map(([grade, allowedQuestionTypes]) => {
      const typedGrade = grade as SupportedGrade;
      const learningStage = getLearningStage(typedGrade);

      return [
        typedGrade,
        {
          learningGoals: learningGoalsByGrade[typedGrade],
          allowedQuestionTypes,
          rules: [...rulesByStage[learningStage]],
          difficultyGuidance: difficultyGuidance[learningStage]
        }
      ];
    })
  ) as Record<SupportedGrade, GradeQuestionConfig>;

export const getGradeQuestionConfig = (grade: SupportedGrade) => gradeQuestionConfig[grade];

export const getQuestionTypeDistribution = (
  grade: SupportedGrade,
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

export const isQuestionTypeAllowedForGrade = (grade: SupportedGrade, questionType: QuestionType) =>
  getGradeQuestionConfig(grade).allowedQuestionTypes.includes(questionType);
