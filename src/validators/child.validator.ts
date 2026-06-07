import { z } from 'zod';
import { gradeSchema } from './exam.validator';

const childIdParamsSchema = z
  .object({
    childId: z.string().uuid()
  })
  .strict();

const childProfileBodySchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    age: z.number().int().min(2).max(10),
    grade: gradeSchema,
    avatarUrl: z.string().url().max(500).nullable().optional()
  })
  .strict();

export const createChildSchema = z.object({
  body: childProfileBodySchema
});

export const updateChildSchema = z.object({
  params: childIdParamsSchema,
  body: childProfileBodySchema.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  })
});

export const childIdParamsRequestSchema = z.object({
  params: childIdParamsSchema
});

export type CreateChildInput = z.infer<typeof createChildSchema>['body'];
export type UpdateChildInput = z.infer<typeof updateChildSchema>['body'];
export type ChildIdParams = z.infer<typeof childIdParamsRequestSchema>['params'];
