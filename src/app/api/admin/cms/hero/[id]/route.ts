import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireCmsAccess } from "../../_auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type IdParam = { id: string };

const PatchSchema = z.object({
  title: z.string().min(2).max(150).optional(),
  description: z.string().max(300).nullable().optional(),
  callToActionText: z.string().max(50).nullable().optional(),
  callToActionUrl: z.string().max(500).nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  imageId: z.string().uuid().nullable().optional(),
  sourceNewsId: z.string().uuid().nullable().optional(),
  order: z.number().int().optional(),
});

export async function GET(_req: Request, ctx: { params: Promise<IdParam> }) {
  const gate = await requireCmsAccess(_req);
  if ("error" in gate) return gate.error;

  const { id } = await ctx.params;

  const row = await prisma.heroSlide.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true } },
      image: { select: { id: true, publicUrl: true, alt: true } },
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

  // Derive publishedAt updates
  let publishedAtUpdate: Date | null | undefined = undefined;
  if (body.status === "PUBLISHED" && body.publishedAt === undefined) {
    const current = await prisma.heroSlide.findUnique({
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

  await prisma.heroSlide.update({
    where: { id },
    data: {
      ...body,
      // Handle nullable fields explicitly
      description: body.description,
      callToActionText: body.callToActionText,
      callToActionUrl: body.callToActionUrl,
      imageId: body.imageId,
      sourceNewsId: body.sourceNewsId,
      publishedAt: publishedAtUpdate,
      updatedById: session.user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "CMS_HERO_SLIDE_UPDATE",
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
    await prisma.heroSlide.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "CMS_HERO_SLIDE_DELETE",
      targetId: id,
    },
  });

  return NextResponse.json({ ok: true });
}
