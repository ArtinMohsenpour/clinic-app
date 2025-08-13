/*
  Warnings:

  - A unique constraint covering the columns `[employeeCode]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('PAYSLIP', 'CONTRACT', 'POLICY', 'ID_SCAN', 'OTHER');

-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "employeeCode" TEXT;

-- CreateTable
CREATE TABLE "public"."Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "secondaryEmail" TEXT,
    "locale" TEXT,
    "timezone" TEXT,
    "notifyByEmail" BOOLEAN NOT NULL DEFAULT true,
    "emergencyName" TEXT,
    "emergencyPhone" TEXT,
    "avatarKey" TEXT,
    "avatarThumbUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."branch" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "timezone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."department" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_branch" (
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "departmentId" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "positionTitle" TEXT,

    CONSTRAINT "user_branch_pkey" PRIMARY KEY ("userId","branchId")
);

-- CreateTable
CREATE TABLE "public"."document" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "periodMonth" INTEGER,
    "periodYear" INTEGER,
    "fileKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "sha256" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_log" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "public"."Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "branch_key_key" ON "public"."branch"("key");

-- CreateIndex
CREATE UNIQUE INDEX "department_key_key" ON "public"."department"("key");

-- CreateIndex
CREATE INDEX "user_branch_userId_idx" ON "public"."user_branch"("userId");

-- CreateIndex
CREATE INDEX "user_branch_branchId_idx" ON "public"."user_branch"("branchId");

-- CreateIndex
CREATE INDEX "user_branch_departmentId_idx" ON "public"."user_branch"("departmentId");

-- CreateIndex
CREATE INDEX "document_userId_type_periodYear_periodMonth_idx" ON "public"."document"("userId", "type", "periodYear", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "document_userId_type_periodYear_periodMonth_key" ON "public"."document"("userId", "type", "periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "audit_log_actorId_action_createdAt_idx" ON "public"."audit_log"("actorId", "action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_employeeCode_key" ON "public"."user"("employeeCode");

-- AddForeignKey
ALTER TABLE "public"."Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_branch" ADD CONSTRAINT "user_branch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_branch" ADD CONSTRAINT "user_branch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_branch" ADD CONSTRAINT "user_branch_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document" ADD CONSTRAINT "document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document" ADD CONSTRAINT "document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_log" ADD CONSTRAINT "audit_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
