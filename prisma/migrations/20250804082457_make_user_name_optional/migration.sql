/*
  Warnings:

  - You are about to drop the column `emailVerifiedAt` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."user" DROP COLUMN "emailVerifiedAt",
ALTER COLUMN "emailVerified" SET DEFAULT false;
