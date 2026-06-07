-- CreateTable
CREATE TABLE "child_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "grade" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "examId" TEXT,
    "grade" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "totalMarks" INTEGER,
    "earnedMarks" INTEGER,
    "scorePercentage" DOUBLE PRECISION NOT NULL,
    "timeSpentSeconds" INTEGER,
    "answers" JSONB,
    "strongTopics" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "weakTopics" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "strengths" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "needsPractice" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "recommendations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "suggestedDifficulty" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "child_profiles_userId_idx" ON "child_profiles"("userId");

-- CreateIndex
CREATE INDEX "exam_attempts_userId_idx" ON "exam_attempts"("userId");

-- CreateIndex
CREATE INDEX "exam_attempts_childId_attemptedAt_idx" ON "exam_attempts"("childId", "attemptedAt");

-- CreateIndex
CREATE INDEX "ai_insights_userId_idx" ON "ai_insights"("userId");

-- CreateIndex
CREATE INDEX "ai_insights_childId_createdAt_idx" ON "ai_insights"("childId", "createdAt");

-- AddForeignKey
ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
