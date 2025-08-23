// app/api/admin/cms/news/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireCmsAccess } from "../../_auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type IdParam = { id: string };


const BodyMarkdown = z.object({
  type: z.literal("markdown"),
  content: z.string(),
});

const PatchSchema = z
  .object({
    title: z.string().min(2).max(120).optional(),
    slug: z
      .string()
      .min(2)
      .max(200)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    excerpt: z.string().max(300).nullable().optional(),
    body: BodyMarkdown.optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).optional(),
    publishedAt: z.string().datetime().nullable().optional(),
    coverId: z.string().uuid().nullable().optional(),
    tagIds: z.array(z.string().uuid()).optional(),
    categoryIds: z.array(z.string().uuid()).optional(),
    gallery: z
      .array(
        z.object({
          mediaId: z.string().uuid(),
          order: z.number().int().min(0).default(0),
        })
      )
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (val.body?.content) {
      const words = val.body.content.trim().split(/\s+/).filter(Boolean).length;
      if (words > 3000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "متن بیش از ۳۰۰۰ کلمه است",
          path: ["body", "content"],
        });
      }
    }
    if (val.status === "SCHEDULED" && val.publishedAt === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "برای زمان‌بندی، تاریخ/زمان لازم است",
        path: ["publishedAt"],
      });
    }
  });

export async function GET(_req: Request, ctx: { params: Promise<IdParam> }) {
   const gate = await requireCmsAccess(_req);
  if ("error" in gate) return gate.error;

  const { id } = await ctx.params;

  const row = await prisma.news.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true } },
      cover: { select: { id: true, publicUrl: true, alt: true } },
      tags: {
        select: { tag: { select: { id: true, key: true, name: true } } },
        orderBy: { tagId: "asc" },
      },
      categories: {
        select: { category: { select: { id: true, key: true, name: true } } },
      },
      media: {
        select: {
          media: { select: { id: true, publicUrl: true, alt: true } },
          order: true,
          mediaId: true,
        },
        orderBy: { order: "asc" },
      },
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
    const exists = await prisma.news.findFirst({
      where: { slug: body.slug, NOT: { id } },
      select: { id: true },
    });
    if (exists)
      return NextResponse.json({ error: "duplicate_slug" }, { status: 409 });
  }

  // derive publishedAt updates
  let publishedAtUpdate: Date | null | undefined = undefined;
  if (body.status === "PUBLISHED" && body.publishedAt === undefined) {
    const current = await prisma.news.findUnique({
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

  await prisma.$transaction(async (tx) => {
    await tx.news.update({
      where: { id },
      data: {
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt ?? undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: body.body as any,
        status: body.status,
        publishedAt: publishedAtUpdate,
        coverId: body.coverId !== undefined ? body.coverId : undefined,
        updatedById: session.user.id,
      },
    });

    if (body.tagIds) {
      await tx.newsTag.deleteMany({ where: { newsId: id } });
      if (body.tagIds.length) {
        await tx.newsTag.createMany({
          data: body.tagIds.map((tagId) => ({ newsId: id, tagId })),
          skipDuplicates: true,
        });
      }
    }

    if (body.categoryIds) {
      await tx.newsCategory.deleteMany({ where: { newsId: id } });
      if (body.categoryIds.length) {
        await tx.newsCategory.createMany({
          data: body.categoryIds.map((categoryId) => ({
            newsId: id,
            categoryId,
          })),
          skipDuplicates: true,
        });
      }
    }

    if (body.gallery) {
      await tx.newsMedia.deleteMany({ where: { newsId: id } });
      if (body.gallery.length) {
        await tx.newsMedia.createMany({
          data: body.gallery.map((g) => ({
            newsId: id,
            mediaId: g.mediaId,
            order: g.order ?? 0,
          })),
          skipDuplicates: true,
        });
      }
    }
  });

  // AUDIT: update
  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "CMS_NEWS_UPDATE",
      targetId: id,
      meta: { changed: Object.keys(body) }, // simple “what changed” hint
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
    await prisma.news.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // AUDIT: delete
  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "CMS_NEWS_DELETE",
      targetId: id,
    },
  });

  return NextResponse.json({ ok: true });
}
