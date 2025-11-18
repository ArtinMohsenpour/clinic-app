// src/app/api/admin/cms/doctors-schedule/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCmsAccess } from "../_auth";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CreateEntrySchema = z.object({
  scheduleId: z.string().uuid(),
  doctorId: z.string().uuid(),
  dayOfWeek: z.enum([
    "SATURDAY",
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
  ]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)"),
  notes: z.string().max(200).optional().nullable(),
});

// GET a schedule for a specific branch (no changes here)
export async function GET(req: Request) {
  // ... (GET handler remains unchanged)
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");

  if (!branchId) {
    return NextResponse.json(
      { error: "branchId is required" },
      { status: 400 }
    );
  }

  const includeOptions: Prisma.ScheduleInclude = {
    entries: {
      include: {
        doctor: { select: { id: true, name: true, specialty: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    },
  };

  let schedule = await prisma.schedule.findUnique({
    where: { branchId },
    include: includeOptions,
  });

  if (!schedule) {
    schedule = await prisma.schedule.create({
      data: {
        branchId: branchId,
        updatedById: gate.session.user.id,
      },
      include: includeOptions,
    });
  }

  return NextResponse.json(schedule);
}

// POST a new entry to a schedule
export async function POST(req: Request) {
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;
  const { session } = gate;

  const json = await req.json();
  const parsed = CreateEntrySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const body = parsed.data;

  // --- START: CONFLICT VALIDATION LOGIC ---

  const conflictingEntry = await prisma.scheduleEntry.findFirst({
    where: {
      doctorId: body.doctorId,
      dayOfWeek: body.dayOfWeek,
      // Check for time overlap:
      // (newStartTime < existingEndTime) AND (newEndTime > existingStartTime)
      startTime: {
        lt: body.endTime, // The new shift starts before the existing one ends
      },
      endTime: {
        gt: body.startTime, // The new shift ends after the existing one starts
      },
    },
    include: {
      schedule: {
        include: {
          branch: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (conflictingEntry) {
    const branchName = conflictingEntry.schedule.branch.name;
    const errorMessage = `این پزشک در حال حاضر در شعبه "${branchName}" در همین روز و ساعت (${conflictingEntry.startTime} - ${conflictingEntry.endTime}) برنامه دارد.`;
    return NextResponse.json({ error: errorMessage }, { status: 409 }); // 409 Conflict
  }

  // --- END: CONFLICT VALIDATION LOGIC ---

  const createdEntry = await prisma.scheduleEntry.create({
    data: {
      scheduleId: body.scheduleId,
      doctorId: body.doctorId,
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      notes: body.notes,
    },
  });

  // Also update the parent schedule's updatedAt timestamp
  await prisma.schedule.update({
    where: { id: body.scheduleId },
    data: { updatedAt: new Date(), updatedById: session.user.id },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "CMS_SCHEDULE_ENTRY_CREATE",
      targetId: createdEntry.id,
      meta: { scheduleId: body.scheduleId, doctorId: body.doctorId },
    },
  });

  return NextResponse.json({ ok: true, id: createdEntry.id }, { status: 201 });
}
