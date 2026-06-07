-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('EXAM_GENERATION', 'AI_INSIGHT_GENERATION');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('NONE', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "users"
ADD COLUMN "plan" "PlanType" NOT NULL DEFAULT 'FREE';

-- Normalize existing operation names before converting the column to an enum.
UPDATE "usage_logs"
SET "operationType" = CASE
  WHEN "operationType" = 'AI_INSIGHT_GENERATION'
    OR lower("operationType") IN ('ai_insight_generation', 'analytics_generation')
    THEN 'AI_INSIGHT_GENERATION'
  ELSE 'EXAM_GENERATION'
END;

-- AlterTable
ALTER TABLE "usage_logs"
ADD COLUMN "inputTokens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "outputTokens" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "operationType" TYPE "OperationType" USING ("operationType"::"OperationType");

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'NONE',
    "productId" TEXT,
    "originalTransactionId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usage_logs_userId_createdAt_idx" ON "usage_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_originalTransactionId_idx" ON "subscriptions"("originalTransactionId");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
