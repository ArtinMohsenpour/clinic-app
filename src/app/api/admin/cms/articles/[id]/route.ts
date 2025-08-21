import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { STAFF_MANAGEMENT_ALLOWED_ROLES } from "@/config/constants/rbac";

type IdParam = { id: string };

async function requireCMS(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user)
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  const can = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      roles: {
        some: {
          role: { key: { in: Array.from(STAFF_MANAGEMENT_ALLOWED_ROLES) } },
        },
      },
    },
    select: { id: true },
  });
  if (!can)
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  return { session };
}

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
  const gate = await requireCMS(_req);
  if ("error" in gate) return gate.error;

  const { id } = await ctx.params;

  const row = await prisma.article.findUnique({
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
  const gate = await requireCMS(req);
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

  // slug uniqueness (exclude self)
  if (body.slug) {
    const exists = await prisma.article.findFirst({
      where: { slug: body.slug, NOT: { id } },
      select: { id: true },
    });
    if (exists)
      return NextResponse.json({ error: "duplicate_slug" }, { status: 409 });
  }

  // Derive publishedAt updates
  let publishedAtUpdate: Date | null | undefined = undefined;
  if (body.status === "PUBLISHED" && body.publishedAt === undefined) {
    // if moving to PUBLISHED and publishedAt not explicitly sent,
    // set it if currently null
    const current = await prisma.article.findUnique({
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
    // main update
    await tx.article.update({
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

    // replace tags if provided
    if (body.tagIds) {
      await tx.articleTag.deleteMany({ where: { articleId: id } });
      if (body.tagIds.length) {
        await tx.articleTag.createMany({
          data: body.tagIds.map((tagId) => ({ articleId: id, tagId })),
          skipDuplicates: true,
        });
      }
    }

    // replace categories if provided
    if (body.categoryIds) {
      await tx.articleCategory.deleteMany({ where: { articleId: id } });
      if (body.categoryIds.length) {
        await tx.articleCategory.createMany({
          data: body.categoryIds.map((categoryId) => ({
            articleId: id,
            categoryId,
          })),
          skipDuplicates: true,
        });
      }
    }

    // replace gallery if provided
    if (body.gallery) {
      await tx.articleMedia.deleteMany({ where: { articleId: id } });
      if (body.gallery.length) {
        await tx.articleMedia.createMany({
          data: body.gallery.map((g) => ({
            articleId: id,
            mediaId: g.mediaId,
            order: g.order ?? 0,
          })),
          skipDuplicates: true,
        });
      }
    }
  });

  try {
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CMS_ARTICLE_UPDATE",
        targetId: id,
        meta: {
          title: body.title,
          slug: body.slug,
          status: body.status,
          coverId: body.coverId,
        },
      },
    });
  } catch {
    // optional: swallow logging errors
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: { params: Promise<IdParam> }) {
  const gate = await requireCMS(req);
  if ("error" in gate) return gate.error;
  const { session } = gate;
  const { id } = await ctx.params;

  try {
    await prisma.article.delete({ where: { id } });
    try {
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "CMS_ARTICLE_DELETE",
          targetId: id,
          meta: {},
        },
      });
    } catch {}
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "delete_failed" }, { status: 400 });
  }
}
