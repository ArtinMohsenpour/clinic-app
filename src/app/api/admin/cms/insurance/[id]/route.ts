// app/api/admin/cms/insurances/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireCmsAccess } from "../../_auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type IdParam = { id: string };

const PatchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().max(500).nullable().optional(),
  coverageText: z.string().max(300).nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  coverId: z.string().uuid().nullable().optional(),
});

export async function GET(_req: Request, ctx: { params: Promise<IdParam> }) {
  const gate = await requireCmsAccess(_req);
  if ("error" in gate) return gate.error;

  const { id } = await ctx.params;

  const row = await prisma.insuranceCompany.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true } },
      cover: { select: { id: true, publicUrl: true, alt: true } },
    },
  });

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

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

  // unique slug (excluding this row)
  if (body.slug) {
    const exists = await prisma.insuranceCompany.findFirst({
      where: { slug: body.slug, NOT: { id } },
      select: { id: true },
    });
    if (exists)
      return NextResponse.json({ error: "duplicate_slug" }, { status: 409 });
  }

  // derive publishedAt updates
  let publishedAtUpdate: Date | null | undefined = undefined;
  if (body.status === "PUBLISHED" && body.publishedAt === undefined) {
    const current = await prisma.insuranceCompany.findUnique({
      where: { id },
      select: { publishedAt: true },
    });
    if (!current)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (current.publishedAt == null) publishedAtUpdate = new Date();
  }
  if (body.publishedAt !== undefined) {
    publishedAtUpdate = body.publishedAt ? new Date(body.publishedAt) : null;
  }

  await prisma.insuranceCompany.update({
    where: { id },
    data: {
      name: body.name,
      slug: body.slug,
      description: body.description,
      coverageText: body.coverageText,
      status: body.status,
      publishedAt: publishedAtUpdate,
      coverId: body.coverId !== undefined ? body.coverId : undefined,
      updatedById: session.user.id,
    },
  });

  // AUDIT: update
  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "CMS_INSURANCE_UPDATE",
      targetId: id,
      meta: { changed: Object.keys(body) },
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: { params: Promise<IdParam> }) {
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;
  const { session } = gate;
  const { id } = await ctx.params;

  try {
    await prisma.insuranceCompany.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // AUDIT: delete
  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "CMS_INSURANCE_DELETE",
      targetId: id,
    },
  });

  return NextResponse.json({ ok: true });
}
