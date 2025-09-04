/*
  Warnings:

  - You are about to drop the column `embedding` on the `Content` table. All the data in the column will be lost.
  - Made the column `description` on table `Content` required. This step will fail if there are existing NULL values in that column.
  - Made the column `title` on table `Content` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "public"."Content" DROP COLUMN "embedding",
ADD COLUMN     "status" "public"."ProcessingStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "title" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."ContentChunk" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "chunkText" TEXT NOT NULL,
    "embedding" vector(768),

    CONSTRAINT "ContentChunk_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ContentChunk" ADD CONSTRAINT "ContentChunk_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
