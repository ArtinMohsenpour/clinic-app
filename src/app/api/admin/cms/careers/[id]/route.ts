// src/app/api/admin/cms/careers/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireCmsAccess } from "../../_auth";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type IdParam = { id: string };

// Validation schema for updating (all fields optional)
const PatchSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().max(10000).nullable().optional(),
  department: z.string().max(100).nullable().optional(),
  location: z.string().max(100).nullable().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]).optional(),
  requirements: z.string().max(10000).nullable().optional(),
  status: z.enum(["DRAFT", "OPEN", "CLOSED"]).optional(),
});

// GET: Fetch single career details
export async function GET(_req: Request, ctx: { params: Promise<IdParam> }) {
  const gate = await requireCmsAccess(_req);
  if ("error" in gate) return gate.error;

  const { id } = await ctx.params;

  const row = await prisma.career.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true } },
      updatedBy: { select: { id: true, name: true } },
      // You might want to include recent applications here later if needed
      _count: { select: { applications: true } },
    },
  });

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(row);
}

// PATCH: Update existing career
export async function PATCH(req: Request, ctx: { params: Promise<IdParam> }) {
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;
  const { session } = gate;
  const { id } = await ctx.params;

  // 1. Validate Body
  const json = await req.json();
  const parsed = PatchSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const body = parsed.data;

  // 2. Check if exists
  const existing = await prisma.career.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 3. Update in Transaction (Update + Audit)
  await prisma.$transaction(async (tx) => {
    await tx.career.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        department: body.department,
        location: body.location,
        employmentType: body.employmentType,
        requirements: body.requirements,
        status: body.status,
        updatedById: session.user.id,
      },
    });

    // Only log if something meaningful changed
    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CMS_CAREER_UPDATE",
        targetId: id,
        meta: { ...body }, // Log changed fields
      },
    });
  });

  revalidateTag("careers");

  return NextResponse.json({ ok: true });
}

// DELETE: Remove a career
export async function DELETE(req: Request, ctx: { params: Promise<IdParam> }) {
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;
  const { session } = gate;
  const { id } = await ctx.params;

  const existing = await prisma.career.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Use transaction to ensure delete + audit happen together
  await prisma.$transaction(async (tx) => {
    // Cascading delete will handle applications automatically (defined in schema)
    await tx.career.delete({ where: { id } });

    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CMS_CAREER_DELETE",
        targetId: id,
        meta: { title: existing.title },
      },
    });
  });

  revalidateTag("careers");

  return NextResponse.json({ ok: true });
}
