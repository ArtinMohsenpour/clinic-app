import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { STAFF_MANAGEMENT_ALLOWED_ROLES } from "@/config/constants/rbac";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

const CreateSchema = z
  .object({
    question: z.string().min(2).max(200),
    slug: z
      .string()
      .min(2)
      .max(200)
      .regex(/^[a-z0-9-]+$/),
    answer: BodyMarkdown,
    status: z
      .enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"])
      .default("DRAFT"),
    publishedAt: z.string().datetime().nullable().optional(),

    // display/ordering extras
    isPinned: z.boolean().optional().default(false),
    order: z.number().int().min(0).optional().default(0),

    // taxonomy
    tagIds: z.array(z.string().uuid()).optional().default([]),
    categoryIds: z.array(z.string().uuid()).optional().default([]),
  })
  .superRefine((val, ctx) => {
    const words = val.answer.content.trim().split(/\s+/).filter(Boolean).length;
    if (words > 3000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "متن پاسخ بیش از ۳۰۰۰ کلمه است",
        path: ["answer", "content"],
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
  const gate = await requireCMS(req);
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

  const where: Prisma.FaqWhereInput = {};
  const STATUS = ["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"] as const;

  if ((STATUS as readonly string[]).includes(statusRaw)) {
    where.status = statusRaw as (typeof STATUS)[number];
  }
  if (q) {
    where.OR = [
      { question: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }
  if (tagId) where.tags = { some: { tagId } };
  if (categoryId) where.categories = { some: { categoryId } };

  const [total, items] = await Promise.all([
    prisma.faq.count({ where }),
    prisma.faq.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { order: "asc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
      select: {
        id: true,
        question: true,
        slug: true,
        status: true,
        isPinned: true,
        order: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true } },
        _count: { select: { tags: true, categories: true } },
      },
    }),
  ]);

  return NextResponse.json({ page, pageSize, total, items });
}

export async function POST(req: Request) {
  const gate = await requireCMS(req);
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

  const exists = await prisma.faq.findUnique({
    where: { slug: body.slug },
    select: { id: true },
  });
  if (exists)
    return NextResponse.json({ error: "duplicate_slug" }, { status: 409 });

  let publishedAt: Date | null | undefined = null;
  if (body.status === "PUBLISHED" && !body.publishedAt)
    publishedAt = new Date();
  else if (body.publishedAt) publishedAt = new Date(body.publishedAt);

  const created = await prisma.faq.create({
    data: {
      question: body.question,
      slug: body.slug,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      answer: body.answer as any,
      status: body.status,
      publishedAt,
      isPinned: body.isPinned ?? false,
      order: body.order ?? 0,
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
    },
    select: { id: true, slug: true, status: true },
  });

  // AUDIT
  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "CMS_FAQ_CREATE",
      targetId: created.id,
      meta: { slug: created.slug, status: created.status },
    },
  });

  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
