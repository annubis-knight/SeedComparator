-- AlterTable
ALTER TABLE "Generation" ADD COLUMN     "phase" TEXT NOT NULL DEFAULT 'wireframe',
ADD COLUMN     "promptVariant" TEXT NOT NULL DEFAULT 'A';

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "activePhase" TEXT NOT NULL DEFAULT 'wireframe',
ADD COLUMN     "promptsByPhase" JSONB;

-- CreateTable
CREATE TABLE "HelperConversation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HelperConversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HelperConversation_sessionId_idx" ON "HelperConversation"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "HelperConversation_sessionId_phase_key" ON "HelperConversation"("sessionId", "phase");

-- CreateIndex
CREATE INDEX "Generation_phase_idx" ON "Generation"("phase");

-- AddForeignKey
ALTER TABLE "HelperConversation" ADD CONSTRAINT "HelperConversation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
