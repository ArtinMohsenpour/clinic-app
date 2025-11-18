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
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const can = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      roles: { some: { role: { key: { in: Array.from(STAFF_MANAGEMENT_ALLOWED_ROLES) } } } },
    },
    select: { id: true },
  });
  if (!can) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { session };
}

const CreateSchema = z.object({
  title: z.string().min(2).max(160),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().max(600).nullable().optional(),
  kind: z.enum(["ADMISSION","CONSENT","PRE_VISIT","INSURANCE","OTHER"]).nullable().optional(),
  language: z.string().max(8).nullable().optional(),
  status: z.enum(["DRAFT","PUBLISHED","SCHEDULED","ARCHIVED"]).default("DRAFT"),
  publishedAt: z.string().datetime().nullable().optional(),

  primaryFileId: z.string().uuid().nullable().optional(),
  previewImageId: z.string().uuid().nullable().optional(),

  tagIds: z.array(z.string().uuid()).optional().default([]),
  categoryIds: z.array(z.string().uuid()).optional().default([]),

  // attachments
  assets: z.array(
    z.object({
      mediaId: z.string().uuid(),
      order: z.number().int().min(0).default(0),
      role: z.enum(["ATTACHMENT","IMAGE"]).default("ATTACHMENT"),
    })
  ).optional().default([]),
}).superRefine((val, ctx) => {
  if (val.status === "SCHEDULED" && !val.publishedAt) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "برای زمان‌بندی، تاریخ/زمان لازم است", path: ["publishedAt"] });
  }
});

export async function GET(req: Request) {
  const gate = await requireCMS(req);
  if ("error" in gate) return gate.error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10)));
  const skip = (page - 1) * pageSize;

  const q = (searchParams.get("q") ?? "").trim();
  const statusRaw = (searchParams.get("status") ?? "").trim().toUpperCase();
  const tagId = (searchParams.get("tagId") ?? "").trim();
  const categoryId = (searchParams.get("categoryId") ?? "").trim();
  const kind = (searchParams.get("kind") ?? "").trim().toUpperCase();
  const language = (searchParams.get("language") ?? "").trim();

  const where: Prisma.FormFileWhereInput = {};
  const STATUS = ["DRAFT","PUBLISHED","SCHEDULED","ARCHIVED"] as const;

  if ((STATUS as readonly string[]).includes(statusRaw)) {
    where.status = statusRaw as (typeof STATUS)[number];
  }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { slug:  { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (tagId) where.tags = { some: { tagId } };
  if (categoryId) where.categories = { some: { categoryId } };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (kind) where.kind = kind as any;
  if (language) where.language = language;

  const [total, items] = await Promise.all([
    prisma.formFile.count({ where }),
    prisma.formFile.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip, take: pageSize,
      select: {
        id: true, title: true, slug: true, status: true, publishedAt: true,
        createdAt: true, updatedAt: true, kind: true, language: true,
        author: { select: { id: true, name: true } },
        primaryFile: { select: { id: true, publicUrl: true, mimeType: true, size: true, alt: true } },
        previewImage: { select: { id: true, publicUrl: true, alt: true } },
        _count: { select: { tags: true, categories: true, assets: true } },
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
    return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const exists = await prisma.formFile.findUnique({ where: { slug: body.slug }, select: { id: true } });
  if (exists) return NextResponse.json({ error: "duplicate_slug" }, { status: 409 });

  let publishedAt: Date | null | undefined = null;
  if (body.status === "PUBLISHED" && !body.publishedAt) publishedAt = new Date();
  else if (body.publishedAt) publishedAt = new Date(body.publishedAt);

  const created = await prisma.formFile.create({
    data: {
      title: body.title,
      slug: body.slug,
      description: body.description ?? null,
      kind: body.kind ?? null,
      language: body.language ?? null,
      status: body.status,
      publishedAt,
      primaryFileId: body.primaryFileId ?? null,
      previewImageId: body.previewImageId ?? null,

      authorId: session.user.id,
      updatedById: session.user.id,

      tags: { create: (body.tagIds ?? []).map((tagId) => ({ tag: { connect: { id: tagId } } })) },
      categories: { create: (body.categoryIds ?? []).map((categoryId) => ({ category: { connect: { id: categoryId } } })) },
      assets: { create: (body.assets ?? []).map((a) => ({ mediaId: a.mediaId, order: a.order ?? 0, role: a.role })) },
    },
    select: { id: true, slug: true, status: true },
  });

  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "CMS_FORM_CREATE", targetId: created.id, meta: { slug: created.slug, status: created.status } },
  });

  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
