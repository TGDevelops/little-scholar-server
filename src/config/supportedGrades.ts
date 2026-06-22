export const supportedGrades = [
  'Nursery',
  'LKG',
  'UKG',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5'
] as const;

export type SupportedGrade = (typeof supportedGrades)[number];
export type LearningStage = 'FOUNDATIONAL' | 'PREPARATORY';

export const getLearningStage = (grade: SupportedGrade): LearningStage => {
  if (['Nursery', 'LKG', 'UKG', 'Grade 1', 'Grade 2'].includes(grade)) {
    return 'FOUNDATIONAL';
  }

  return 'PREPARATORY';
};
