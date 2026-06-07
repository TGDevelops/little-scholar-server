import { PlanType } from '@prisma/client';
import { prisma } from '../config/prisma';

export const subscriptionService = {
  async getUserPlan(userId: string): Promise<PlanType> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true }
    });

    return user?.plan ?? PlanType.FREE;
  },

  async setUserPlan(userId: string, plan: PlanType) {
    // TODO: StoreKit 2 integration should validate entitlement state before plan changes.
    // TODO: App Store Server API verification should confirm signed transaction payloads.
    // TODO: originalTransactionId handling should map renewals to an existing subscription.
    // TODO: subscription renewal webhook handling should update periods and entitlement status.
    return prisma.user.update({
      where: { id: userId },
      data: { plan },
      select: { id: true, plan: true, updatedAt: true }
    });
  },

  async isPremium(userId: string): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    return plan === PlanType.PREMIUM;
  }
};
