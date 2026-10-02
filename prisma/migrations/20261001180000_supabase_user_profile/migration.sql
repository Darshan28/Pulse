-- Replace anonymous cookie User with Supabase-backed UserProfile.
-- Existing anonymous presenter users/sessions are cleared (breaking auth model change).

ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_createdById_fkey";

DELETE FROM "ResponseAnswer";
DELETE FROM "Response";
DELETE FROM "QuestionOption";
DELETE FROM "Question";
DELETE FROM "Participant";
DELETE FROM "Session";
DROP TABLE IF EXISTS "User";

CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT,
    "useCases" JSONB NOT NULL DEFAULT '[]',
    "audienceSize" TEXT,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserProfile_authUserId_key" ON "UserProfile"("authUserId");

ALTER TABLE "Session" ADD CONSTRAINT "Session_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
