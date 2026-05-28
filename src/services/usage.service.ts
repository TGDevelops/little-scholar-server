import { prisma } from '../config/prisma';

export const usageService = {
  async logUsage(input: {
    userId: string;
    provider: string;
    tokensUsed: number;
    operationType: string;
  }) {
    return prisma.usageLog.create({
      data: input
    });
  }
};
