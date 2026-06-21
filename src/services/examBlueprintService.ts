import { AppError } from '../utils/AppError';
import { cbseConceptMap } from '../config/cbseSyllabus';
import { difficultyGuidance } from '../config/difficultyGuidance';
import { questionTypesByGrade, type QuestionType } from '../config/questionTypesByGrade';
import { getLearningStage, type LearningStage } from '../config/supportedGrades';
import type { Difficulty, Grade, Subject } from '../validators/exam.validator';

export type ExamBlueprint = {
  grade: Grade;
  subject: Subject;
  difficulty: Difficulty;
  learningStage: LearningStage;
  allowedConcepts: string[];
  selectedConcepts: string[];
  allowedQuestionTypes: QuestionType[];
  questionTypeDistribution: Record<QuestionType, number>;
  difficultyGuidance: string[];
};

const getConceptSelectionSize = (questionCount: number) => {
  if (questionCount <= 5) {
    return { min: 2, max: 3 };
  }

  if (questionCount <= 10) {
    return { min: 3, max: 5 };
  }

  if (questionCount <= 15) {
    return { min: 4, max: 6 };
  }

  return { min: 5, max: 8 };
};

const selectConcepts = (concepts: string[], questionCount: number) => {
  const { min, max } = getConceptSelectionSize(questionCount);
  const targetCount = Math.min(concepts.length, Math.max(min, Math.min(max, questionCount)));

  return concepts.slice(0, targetCount);
};

const createQuestionTypeDistribution = (
  grade: Grade,
  questionCount: number
): Record<QuestionType, number> => {
  const allowedTypes = questionTypesByGrade[grade];
  const distribution = Object.fromEntries(
    allowedTypes.map((questionType) => [questionType, 0])
  ) as Record<QuestionType, number>;

  for (let index = 0; index < questionCount; index += 1) {
    distribution[allowedTypes[index % allowedTypes.length]] += 1;
  }

  return distribution;
};

export const examBlueprintService = {
  createBlueprint(input: {
    grade: Grade;
    subject: Subject;
    difficulty: Difficulty;
    questionCount: number;
  }): ExamBlueprint {
    const gradeConcepts = cbseConceptMap[input.grade];
    const allowedConcepts = gradeConcepts[input.subject];

    if (!allowedConcepts?.length) {
      throw new AppError(`${input.subject} is not supported for ${input.grade}`, 400, {
        code: 'UNSUPPORTED_GRADE_SUBJECT'
      });
    }

    const learningStage = getLearningStage(input.grade);
    const allowedQuestionTypes = questionTypesByGrade[input.grade];

    return {
      grade: input.grade,
      subject: input.subject,
      difficulty: input.difficulty,
      learningStage,
      allowedConcepts,
      selectedConcepts: selectConcepts(allowedConcepts, input.questionCount),
      allowedQuestionTypes,
      questionTypeDistribution: createQuestionTypeDistribution(input.grade, input.questionCount),
      difficultyGuidance: difficultyGuidance[learningStage][input.difficulty]
    };
  }
};
