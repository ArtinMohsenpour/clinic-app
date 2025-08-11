/*
  Warnings:

  - Made the column `key` on table `role` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."role" ALTER COLUMN "key" SET NOT NULL;
