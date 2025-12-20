// src/app/api/admin/cms/education/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { PublishStatus } from "@prisma/client";
import { requireCmsAccess } from "../_auth";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BodyMarkdown = z.object({
  type: z.literal("markdown"),
  content: z.string(),
});

const CreateSchema = z
  .object({
    title: z.string().min(2).max(120),
    slug: z
      .string()
      .min(2)
      .max(200)
      .regex(/^[a-z0-9-]+$/),
    excerpt: z.string().max(300).nullable().optional(),
    body: BodyMarkdown,
    status: z
      .enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"])
      .default("DRAFT"),
    publishedAt: z.string().datetime().nullable().optional(),
    coverId: z.string().uuid().nullable().optional(),
    tagIds: z.array(z.string().uuid()).optional().default([]),
    categoryIds: z.array(z.string().uuid()).optional().default([]),
    gallery: z
      .array(
        z.object({
          mediaId: z.string().uuid(),
          order: z.number().int().min(0).default(0),
        })
      )
      .optional()
      .default([]),
  })
  .superRefine((val, ctx) => {
    const words = val.body.content.trim().split(/\s+/).filter(Boolean).length;
    if (words > 3000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "متن بیش از ۳۰۰۰ کلمه است",
        path: ["body", "content"],
      });
    }
    if (val.status === "SCHEDULED" && !val.publishedAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "برای زمان‌بندی، تاریخ/زمان لازم است",
        path: ["publishedAt"],
      });
    }
  });

export async function GET(req: Request) {
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10))
  );
  const skip = (page - 1) * pageSize;

  const q = (searchParams.get("q") ?? "").trim();
  const statusRaw = (searchParams.get("status") ?? "").trim().toUpperCase();
  const tagId = (searchParams.get("tagId") ?? "").trim();
  const categoryId = (searchParams.get("categoryId") ?? "").trim();

  const where: Prisma.EducationWhereInput = {};

  // Safe enum check using generated enum
  if ((Object.values(PublishStatus) as string[]).includes(statusRaw)) {
    where.status = statusRaw as PublishStatus;
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }
  if (tagId) where.tags = { some: { tagId } };
  if (categoryId) where.categories = { some: { categoryId } };

  const [total, items] = await Promise.all([
    prisma.education.count({ where }),
    prisma.education.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true } },
        cover: { select: { id: true, publicUrl: true, alt: true } },
        _count: { select: { tags: true, categories: true, media: true } },
      },
    }),
  ]);

  return NextResponse.json({ page, pageSize, total, items });
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

  // unique slug
  const exists = await prisma.education.findUnique({
    where: { slug: body.slug },
    select: { id: true },
  });
  if (exists)
    return NextResponse.json({ error: "duplicate_slug" }, { status: 409 });

  // derive publishedAt
  let publishedAt: Date | null | undefined = null;
  if (body.status === "PUBLISHED" && !body.publishedAt)
    publishedAt = new Date();
  else if (body.publishedAt) publishedAt = new Date(body.publishedAt);

  const created = await prisma.education.create({
    data: {
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body: body.body as any,
      status: body.status,
      publishedAt,
      coverId: body.coverId ?? null,
      authorId: session.user.id,
      updatedById: session.user.id,
      tags: {
        create: (body.tagIds ?? []).map((tagId) => ({
          tag: { connect: { id: tagId } },
        })),
      },
      categories: {
        create: (body.categoryIds ?? []).map((categoryId) => ({
          category: { connect: { id: categoryId } },
        })),
      },
      media: {
        create: (body.gallery ?? []).map((g) => ({
          media: { connect: { id: g.mediaId } },
          order: g.order ?? 0,
        })),
      },
    },
    select: { id: true },
  });

  // audit
  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "CMS_EDU_CREATE",
      targetId: created.id,
      meta: { slug: body.slug, status: body.status },
    },
  });

  revalidateTag("education");

  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
