-- CreateEnum
CREATE TYPE "UsageEventType" AS ENUM ('QUESTION_GENERATION', 'AI_INSIGHT_GENERATION');

-- CreateTable
CREATE TABLE "usage_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "childId" TEXT,
    "eventType" "UsageEventType" NOT NULL,
    "count" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usage_events_userId_idx" ON "usage_events"("userId");

-- CreateIndex
CREATE INDEX "usage_events_userId_eventType_createdAt_idx" ON "usage_events"("userId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "usage_events_userId_childId_eventType_createdAt_idx" ON "usage_events"("userId", "childId", "eventType", "createdAt");

-- AddForeignKey
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
