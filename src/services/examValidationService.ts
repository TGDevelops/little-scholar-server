import { AppError } from '../utils/AppError';
import {
  generatedQuestionSchema,
  type GeneratedExam,
  type GeneratedQuestion
} from '../validators/exam.validator';
import type { ExamBlueprint } from './examBlueprintService';

type ValidationResult = {
  valid: boolean;
  reasons: string[];
};

const forbiddenConceptPatterns: Record<string, RegExp[]> = {
  Nursery: [/reading comprehension/i, /paragraph/i, /multiplication/i, /division/i, /fraction/i],
  LKG: [/paragraph/i, /reading comprehension/i, /multiplication/i, /division/i, /fraction/i],
  UKG: [/multiplication/i, /division/i, /fraction/i, /paragraph/i],
  'Grade 1': [/multiplication/i, /division/i, /fraction/i, /algebra/i],
  'Grade 2': [/advanced fraction/i, /decimal/i, /algebra/i],
  'Grade 3': [/algebra/i, /equation/i],
  'Grade 4': [/complex percentage/i, /algebraic equation/i],
  'Grade 5': [/algebraic equation/i, /advanced algebra/i]
};

const getQuestionText = (question: GeneratedQuestion) =>
  [
    question.question,
    question.topic,
    question.learningObjective,
    question.explanation,
    question.passage
  ]
    .filter(Boolean)
    .join(' ');

const validateRequiredFields = (question: GeneratedQuestion): string[] => {
  const reasons: string[] = [];

  if (!question.id) reasons.push('Missing id');
  if (!question.type) reasons.push('Missing type');
  if (!question.question) reasons.push('Missing question');
  if (!question.correctAnswer) reasons.push('Missing correctAnswer');
  if (!question.explanation) reasons.push('Missing explanation');
  if (!question.topic) reasons.push('Missing topic');
  if (!question.learningObjective) reasons.push('Missing learningObjective');
  if (!question.difficultyLevel) reasons.push('Missing difficultyLevel');
  if (!question.marks) reasons.push('Missing marks');

  return reasons;
};

export const examValidationService = {
  validate(exam: GeneratedExam, blueprint: ExamBlueprint): ValidationResult {
    const reasons: string[] = [];

    if (exam.questions.length !== exam.questionCount) {
      reasons.push('Question array length does not match exam.questionCount');
    }

    const requestedQuestionCount = Object.values(blueprint.questionTypeDistribution).reduce(
      (sum, count) => sum + count,
      0
    );

    if (exam.questions.length !== requestedQuestionCount) {
      reasons.push('Question count does not match requested blueprint count');
    }

    const actualDistribution = new Map<string, number>();

    exam.questions.forEach((question, index) => {
      const questionSchemaResult = generatedQuestionSchema.safeParse(question);

      if (!questionSchemaResult.success) {
        reasons.push(`Question ${index + 1}: ${questionSchemaResult.error.message}`);
      }

      validateRequiredFields(question).forEach((reason) =>
        reasons.push(`Question ${index + 1}: ${reason}`)
      );

      if (!blueprint.allowedQuestionTypes.includes(question.type)) {
        reasons.push(`Question ${index + 1}: unsupported type ${question.type}`);
      }

      if (!blueprint.selectedConcepts.includes(question.topic)) {
        reasons.push(`Question ${index + 1}: topic is not in selectedConcepts`);
      }

      actualDistribution.set(question.type, (actualDistribution.get(question.type) ?? 0) + 1);

      const text = getQuestionText(question);
      const forbiddenPattern = forbiddenConceptPatterns[blueprint.grade]?.find((pattern) =>
        pattern.test(text)
      );

      if (forbiddenPattern) {
        reasons.push(`Question ${index + 1}: possible syllabus drift`);
      }
    });

    Object.entries(blueprint.questionTypeDistribution).forEach(([questionType, expectedCount]) => {
      const actualCount = actualDistribution.get(questionType) ?? 0;

      if (actualCount !== expectedCount) {
        reasons.push(
          `Question type distribution mismatch for ${questionType}: expected ${expectedCount}, got ${actualCount}`
        );
      }
    });

    return {
      valid: reasons.length === 0,
      reasons
    };
  },

  assertValid(exam: GeneratedExam, blueprint: ExamBlueprint) {
    const result = this.validate(exam, blueprint);

    if (!result.valid) {
      throw new AppError('Generated exam failed syllabus validation', 502, {
        code: 'EXAM_VALIDATION_FAILED',
        reasons: result.reasons
      });
    }

    return result;
  }
};
