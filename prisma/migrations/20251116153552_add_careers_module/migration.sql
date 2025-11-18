-- CreateEnum
CREATE TYPE "public"."CareerStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT');

-- CreateEnum
CREATE TYPE "public"."AuditLogAction" AS ENUM ('CMS_EDU_CREATE', 'CMS_EDU_UPDATE', 'CMS_EDU_DELETE', 'CMS_CAREER_CREATE', 'CMS_CAREER_UPDATE', 'CMS_CAREER_DELETE');

-- CreateTable
CREATE TABLE "public"."Career" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "department" VARCHAR(100),
    "location" VARCHAR(100),
    "employmentType" "public"."EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "requirements" TEXT,
    "status" "public"."CareerStatus" NOT NULL DEFAULT 'DRAFT',
    "authorId" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Career_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CareerApplication" (
    "id" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "resumeUrl" TEXT NOT NULL,
    "coverLetter" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Career_status_idx" ON "public"."Career"("status");

-- CreateIndex
CREATE INDEX "Career_authorId_idx" ON "public"."Career"("authorId");

-- CreateIndex
CREATE INDEX "Career_updatedById_idx" ON "public"."Career"("updatedById");

-- CreateIndex
CREATE INDEX "CareerApplication_careerId_idx" ON "public"."CareerApplication"("careerId");

-- AddForeignKey
ALTER TABLE "public"."Career" ADD CONSTRAINT "Career_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Career" ADD CONSTRAINT "Career_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CareerApplication" ADD CONSTRAINT "CareerApplication_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "public"."Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;
