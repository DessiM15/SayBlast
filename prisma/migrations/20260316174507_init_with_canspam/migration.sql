-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'failed');

-- CreateEnum
CREATE TYPE "SendLogStatus" AS ENUM ('sent', 'skipped_cooldown', 'failed');

-- CreateEnum
CREATE TYPE "TranscriptType" AS ENUM ('initial', 'refinement');

-- CreateEnum
CREATE TYPE "EmailProvider" AS ENUM ('gmail', 'outlook', 'smtp');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "image" TEXT,
    "emailProvider" "EmailProvider",
    "emailAddress" TEXT,
    "emailAccessToken" TEXT,
    "emailRefreshToken" TEXT,
    "emailTokenExpiry" TIMESTAMP(3),
    "pendingEmailData" TEXT,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUser" TEXT,
    "smtpPass" TEXT,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "postalAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudienceList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AudienceList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "audienceListId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "metadata" JSONB,
    "lastEmailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "subjectLine" TEXT,
    "htmlBody" TEXT,
    "textBody" TEXT,
    "audienceListId" TEXT,
    "templateId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "htmlTemplate" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceTranscript" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "rawTranscript" TEXT NOT NULL,
    "parsedData" JSONB,
    "type" "TranscriptType" NOT NULL DEFAULT 'initial',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoiceTranscript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SendLog" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "status" "SendLogStatus" NOT NULL,
    "error" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SendLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unsubscribe" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unsubscribe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AudienceList_userId_idx" ON "AudienceList"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_audienceListId_email_key" ON "Contact"("audienceListId", "email");

-- CreateIndex
CREATE INDEX "Campaign_status_scheduledAt_idx" ON "Campaign"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Campaign_userId_idx" ON "Campaign"("userId");

-- CreateIndex
CREATE INDEX "SendLog_contactEmail_status_sentAt_idx" ON "SendLog"("contactEmail", "status", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "Unsubscribe_token_key" ON "Unsubscribe"("token");

-- CreateIndex
CREATE INDEX "Unsubscribe_email_idx" ON "Unsubscribe"("email");

-- CreateIndex
CREATE INDEX "Unsubscribe_token_idx" ON "Unsubscribe"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Unsubscribe_userId_email_key" ON "Unsubscribe"("userId", "email");

-- AddForeignKey
ALTER TABLE "AudienceList" ADD CONSTRAINT "AudienceList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_audienceListId_fkey" FOREIGN KEY ("audienceListId") REFERENCES "AudienceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_audienceListId_fkey" FOREIGN KEY ("audienceListId") REFERENCES "AudienceList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignTemplate" ADD CONSTRAINT "CampaignTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceTranscript" ADD CONSTRAINT "VoiceTranscript_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SendLog" ADD CONSTRAINT "SendLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unsubscribe" ADD CONSTRAINT "Unsubscribe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
