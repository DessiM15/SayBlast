-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "bounceCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bouncedAt" TIMESTAMP(3);
