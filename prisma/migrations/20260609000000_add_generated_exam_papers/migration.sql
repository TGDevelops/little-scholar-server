-- CreateTable
CREATE TABLE "generated_exam_papers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "questions" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "generated_exam_papers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "generated_exam_papers_userId_idx" ON "generated_exam_papers"("userId");

-- CreateIndex
CREATE INDEX "generated_exam_papers_childId_status_idx" ON "generated_exam_papers"("childId", "status");

-- AddForeignKey
ALTER TABLE "generated_exam_papers" ADD CONSTRAINT "generated_exam_papers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_exam_papers" ADD CONSTRAINT "generated_exam_papers_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
