-- CreateEnum
CREATE TYPE "public"."Weekday" AS ENUM ('SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY');

-- CreateTable
CREATE TABLE "public"."schedule" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."schedule_entry" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "dayOfWeek" "public"."Weekday" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "schedule_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schedule_branchId_key" ON "public"."schedule"("branchId");

-- CreateIndex
CREATE INDEX "schedule_entry_scheduleId_dayOfWeek_idx" ON "public"."schedule_entry"("scheduleId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "public"."schedule" ADD CONSTRAINT "schedule_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schedule" ADD CONSTRAINT "schedule_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schedule_entry" ADD CONSTRAINT "schedule_entry_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "public"."schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schedule_entry" ADD CONSTRAINT "schedule_entry_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
