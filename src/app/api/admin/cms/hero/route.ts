import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCmsAccess } from "../_auth";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CreateSchema = z.object({
  title: z.string().min(2).max(150),
  description: z.string().max(300).nullable().optional(),
  callToActionText: z.string().max(50).nullable().optional(),
  callToActionUrl: z.string().max(500).nullable().optional(),
  status: z
    .enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"])
    .default("DRAFT"),
  publishedAt: z.string().datetime().nullable().optional(),
  imageId: z.string().uuid().nullable().optional(),
  sourceNewsId: z.string().uuid().nullable().optional(),
  order: z.number().int().default(0),
});

export async function GET(req: Request) {
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;

  const slides = await prisma.heroSlide.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      status: true,
      order: true,
      publishedAt: true,
      updatedAt: true,
      author: { select: { id: true, name: true } },
      image: { select: { id: true, publicUrl: true, alt: true } },
    },
  });

  // Note: No pagination for hero slides as they are managed by manual order.
  return NextResponse.json({ items: slides });
}

export async function POST(req: Request) {
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;
  const { session } = gate;

  const json = await req.json();
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const body = parsed.data;

  let publishedAt: Date | null | undefined = null;
  if (body.status === "PUBLISHED" && !body.publishedAt)
    publishedAt = new Date();
  else if (body.publishedAt) publishedAt = new Date(body.publishedAt);

  const created = await prisma.heroSlide.create({
    data: {
      title: body.title,
      description: body.description,
      callToActionText: body.callToActionText,
      callToActionUrl: body.callToActionUrl,
      status: body.status,
      publishedAt,
      order: body.order,
      imageId: body.imageId,
      sourceNewsId: body.sourceNewsId,
      authorId: session.user.id,
      updatedById: session.user.id,
    },
    select: { id: true, title: true, status: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "CMS_HERO_SLIDE_CREATE",
      targetId: created.id,
      meta: { title: created.title, status: created.status },
    },
  });

  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
