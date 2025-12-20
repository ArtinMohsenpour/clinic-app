import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { STAFF_MANAGEMENT_ALLOWED_ROLES } from "@/config/constants/rbac";
import { revalidateTag } from "next/cache";

type IdParam = { id: string };

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

const PatchSchema = z
  .object({
    title: z.string().min(2).max(160).optional(),
    slug: z
      .string()
      .min(2)
      .max(200)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    description: z.string().max(600).nullable().optional(),
    kind: z
      .enum(["ADMISSION", "CONSENT", "PRE_VISIT", "INSURANCE", "OTHER"])
      .nullable()
      .optional(),
    language: z.string().max(8).nullable().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).optional(),
    publishedAt: z.string().datetime().nullable().optional(),

    primaryFileId: z.string().uuid().nullable().optional(),
    previewImageId: z.string().uuid().nullable().optional(),

    tagIds: z.array(z.string().uuid()).optional(),
    categoryIds: z.array(z.string().uuid()).optional(),

    assets: z
      .array(
        z.object({
          mediaId: z.string().uuid(),
          order: z.number().int().min(0).default(0),
          role: z.enum(["ATTACHMENT", "IMAGE"]).default("ATTACHMENT"),
        })
      )
      .optional(),
  })
  .superRefine((val, ctx) => {
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

  const row = await prisma.formFile.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true } },
      primaryFile: {
        select: {
          id: true,
          publicUrl: true,
          mimeType: true,
          size: true,
          alt: true,
        },
      },
      previewImage: { select: { id: true, publicUrl: true, alt: true } },
      tags: {
        select: { tag: { select: { id: true, key: true, name: true } } },
      },
      categories: {
        select: { category: { select: { id: true, key: true, name: true } } },
      },
      assets: {
        select: {
          order: true,
          role: true,
          media: {
            select: {
              id: true,
              publicUrl: true,
              mimeType: true,
              size: true,
              alt: true,
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });
  revalidateTag("forms");
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
  if (!parsed.success)
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 }
    );
  const body = parsed.data;

  if (body.slug) {
    const dup = await prisma.formFile.findFirst({
      where: { slug: body.slug, NOT: { id } },
      select: { id: true },
    });
    if (dup)
      return NextResponse.json({ error: "duplicate_slug" }, { status: 409 });
  }

  let publishedAtUpdate: Date | null | undefined = undefined;
  if (body.status === "PUBLISHED" && body.publishedAt === undefined) {
    const current = await prisma.formFile.findUnique({
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
    await tx.formFile.update({
      where: { id },
      data: {
        title: body.title,
        slug: body.slug,
        description: body.description ?? undefined,
        kind: body.kind ?? undefined,
        language: body.language ?? undefined,
        status: body.status,
        publishedAt: publishedAtUpdate,
        primaryFileId:
          body.primaryFileId !== undefined ? body.primaryFileId : undefined,
        previewImageId:
          body.previewImageId !== undefined ? body.previewImageId : undefined,
        updatedById: session.user.id,
      },
    });

    if (body.tagIds) {
      await tx.formFileTag.deleteMany({ where: { formFileId: id } });
      if (body.tagIds.length) {
        await tx.formFileTag.createMany({
          data: body.tagIds.map((tagId) => ({ formFileId: id, tagId })),
          skipDuplicates: true,
        });
      }
    }
    if (body.categoryIds) {
      await tx.formFileCategory.deleteMany({ where: { formFileId: id } });
      if (body.categoryIds.length) {
        await tx.formFileCategory.createMany({
          data: body.categoryIds.map((categoryId) => ({
            formFileId: id,
            categoryId,
          })),
          skipDuplicates: true,
        });
      }
    }
    if (body.assets) {
      await tx.formFileAsset.deleteMany({ where: { formFileId: id } });
      if (body.assets.length) {
        await tx.formFileAsset.createMany({
          data: body.assets.map((a) => ({
            formFileId: id,
            mediaId: a.mediaId,
            order: a.order ?? 0,
            role: a.role,
          })),
          skipDuplicates: true,
        });
      }
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "CMS_FORM_UPDATE",
      targetId: id,
      meta: { slug: body.slug, status: body.status },
    },
  });
  revalidateTag("forms");

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: { params: Promise<IdParam> }) {
  const gate = await requireCMS(req);
  if ("error" in gate) return gate.error;
  const { session } = gate;
  const { id } = await ctx.params;

  await prisma.formFile.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "CMS_FORM_DELETE", targetId: id },
  });

  revalidateTag("forms");
  return NextResponse.json({ ok: true });
}
