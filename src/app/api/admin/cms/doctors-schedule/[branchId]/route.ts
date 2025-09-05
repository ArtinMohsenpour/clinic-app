// src/app/api/admin/cms/doctors-schedule/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireCmsAccess } from "../../_auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type IdParam = { id: string };

const PatchSchema = z.object({
  doctorId: z.string().uuid().optional(),
  dayOfWeek: z
    .enum([
      "SATURDAY",
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
    ])
    .optional(),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  notes: z.string().max(200).optional().nullable(),
});

export async function PATCH(req: Request, ctx: { params: Promise<IdParam> }) {
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;
  const { session } = gate;
  const { id } = await ctx.params;

  const json = await req.json();
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const body = parsed.data;

  // --- START: CONFLICT VALIDATION LOGIC ---

  // Get the current state of the entry to fill in any missing fields from the patch body
  const currentEntry = await prisma.scheduleEntry.findUnique({ where: { id } });
  if (!currentEntry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Merge current data with new data to get the final state for validation
  const finalState = { ...currentEntry, ...body };

  const conflictingEntry = await prisma.scheduleEntry.findFirst({
    where: {
      id: {
        not: id, // IMPORTANT: Exclude the current entry from the check
      },
      doctorId: finalState.doctorId,
      dayOfWeek: finalState.dayOfWeek,
      // Check for time overlap
      startTime: {
        lt: finalState.endTime,
      },
      endTime: {
        gt: finalState.startTime,
      },
    },
    include: {
      schedule: {
        include: {
          branch: { select: { name: true } },
        },
      },
    },
  });

  if (conflictingEntry) {
    const branchName = conflictingEntry.schedule.branch.name;
    const errorMessage = `این پزشک در حال حاضر در شعبه "${branchName}" در همین روز و ساعت (${conflictingEntry.startTime} - ${conflictingEntry.endTime}) برنامه دارد.`;
    return NextResponse.json({ error: errorMessage }, { status: 409 });
  }

  // --- END: CONFLICT VALIDATION LOGIC ---

  const updatedEntry = await prisma.scheduleEntry.update({
    where: { id },
    data: {
      ...body,
    },
  });

  // Also update the parent schedule's updatedAt timestamp
  await prisma.schedule.update({
    where: { id: updatedEntry.scheduleId },
    data: { updatedAt: new Date(), updatedById: session.user.id },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "CMS_SCHEDULE_ENTRY_UPDATE",
      targetId: id,
      meta: { changed: Object.keys(body) },
    },
  });

  return NextResponse.json({ ok: true });
}

// DELETE handler remains unchanged
export async function DELETE(req: Request, ctx: { params: Promise<IdParam> }) {
  // ... (DELETE handler remains unchanged)
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;
  const { session } = gate;
  const { id } = await ctx.params;

  try {
    const entry = await prisma.scheduleEntry.delete({ where: { id } });

    await prisma.schedule.update({
      where: { id: entry.scheduleId },
      data: { updatedAt: new Date(), updatedById: session.user.id },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "CMS_SCHEDULE_ENTRY_DELETE",
      targetId: id,
    },
  });

  return NextResponse.json({ ok: true });
}
