import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { STAFF_MANAGEMENT_ALLOWED_ROLES } from "@/config/constants/rbac";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type IdParam = { id: string };

async function requireCMS(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
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
  if (!can) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session };
}

const BodyMarkdown = z.object({
  type: z.literal("markdown"),
  content: z.string(),
});

const PatchSchema = z
  .object({
    question: z.string().min(2).max(200).optional(),
    slug: z
      .string()
      .min(2)
      .max(200)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    answer: BodyMarkdown.optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).optional(),
    publishedAt: z.string().datetime().nullable().optional(),
    isPinned: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
    tagIds: z.array(z.string().uuid()).optional(),
    categoryIds: z.array(z.string().uuid()).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.answer?.content) {
      const words = val.answer.content
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
      if (words > 3000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "متن پاسخ بیش از ۳۰۰۰ کلمه است",
          path: ["answer", "content"],
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

  const row = await prisma.faq.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true } },
      tags: {
        select: { tag: { select: { id: true, key: true, name: true } } },
        orderBy: { tagId: "asc" },
      },
      categories: {
        select: { category: { select: { id: true, key: true, name: true } } },
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

  if (body.slug) {
    const exists = await prisma.faq.findFirst({
      where: { slug: body.slug, NOT: { id } },
      select: { id: true },
    });
    if (exists)
      return NextResponse.json({ error: "duplicate_slug" }, { status: 409 });
  }

  let publishedAtUpdate: Date | null | undefined = undefined;
  if (body.status === "PUBLISHED" && body.publishedAt === undefined) {
    const current = await prisma.faq.findUnique({
      where: { id },
      select: { publishedAt: true },
    });
    if (!current)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (current.publishedAt == null) publishedAtUpdate = new Date();
  }
  if (body.publishedAt !== undefined)
    publishedAtUpdate = body.publishedAt ? new Date(body.publishedAt) : null;

  await prisma.$transaction(async (tx) => {
    await tx.faq.update({
      where: { id },
      data: {
        question: body.question,
        slug: body.slug,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        answer: body.answer as any,
        status: body.status,
        publishedAt: publishedAtUpdate,
        isPinned: body.isPinned,
        order: body.order,
        updatedById: session.user.id,
      },
    });

    if (body.tagIds) {
      await tx.faqTag.deleteMany({ where: { faqId: id } });
      if (body.tagIds.length) {
        await tx.faqTag.createMany({
          data: body.tagIds.map((tagId) => ({ faqId: id, tagId })),
          skipDuplicates: true,
        });
      }
    }

    if (body.categoryIds) {
      await tx.faqCategory.deleteMany({ where: { faqId: id } });
      if (body.categoryIds.length) {
        await tx.faqCategory.createMany({
          data: body.categoryIds.map((categoryId) => ({
            faqId: id,
            categoryId,
          })),
          skipDuplicates: true,
        });
      }
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "CMS_FAQ_UPDATE",
      targetId: id,
      meta: {
        slug: body.slug,
        status: body.status,
        isPinned: body.isPinned,
        order: body.order,
      },
    },
  });

  revalidateTag("faq");

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: { params: Promise<IdParam> }) {
  const gate = await requireCMS(req);
  if ("error" in gate) return gate.error;
  const { session } = gate;
  const { id } = await ctx.params;

  await prisma.faq.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "CMS_FAQ_DELETE", targetId: id },
  });

  revalidateTag("faq");

  return NextResponse.json({ ok: true });
}
