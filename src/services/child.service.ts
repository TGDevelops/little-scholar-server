import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import type { CreateChildInput, UpdateChildInput } from '../validators/child.validator';

const childSelect = {
  id: true,
  userId: true,
  name: true,
  age: true,
  grade: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true
} as const;

export const childService = {
  async createChild(userId: string, input: CreateChildInput) {
    return prisma.childProfile.create({
      data: {
        userId,
        name: input.name,
        age: input.age,
        grade: input.grade,
        avatarUrl: input.avatarUrl ?? null
      },
      select: childSelect
    });
  },

  async listChildren(userId: string) {
    return prisma.childProfile.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: childSelect
    });
  },

  async updateChild(userId: string, childId: string, input: UpdateChildInput) {
    await this.assertChildBelongsToUser(userId, childId);

    return prisma.childProfile.update({
      where: { id: childId },
      data: {
        ...input,
        avatarUrl: input.avatarUrl === undefined ? undefined : input.avatarUrl
      },
      select: childSelect
    });
  },

  async deleteChild(userId: string, childId: string) {
    await this.assertChildBelongsToUser(userId, childId);

    await prisma.childProfile.delete({
      where: { id: childId }
    });

    return { deleted: true };
  },

  async assertChildBelongsToUser(userId: string, childId: string) {
    const child = await prisma.childProfile.findFirst({
      where: { id: childId, userId },
      select: {
        id: true,
        name: true,
        age: true,
        grade: true
      }
    });

    if (!child) {
      throw new AppError('Child profile not found', 404);
    }

    return child;
  }
};
