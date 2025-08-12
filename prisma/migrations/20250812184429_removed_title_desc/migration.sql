/*
  Warnings:

  - You are about to drop the column `description` on the `Content` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Content` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Content" DROP COLUMN "description",
DROP COLUMN "title";
