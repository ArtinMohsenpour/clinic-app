// app/api/admin/cms/services/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireCmsAccess } from "../../_auth";
import { revalidateTag } from "next/cache";

type IdParam = { id: string };

const BodyMarkdown = z.object({
  type: z.literal("markdown"),
  content: z.string(),
});

const PatchSchema = z
  .object({
    title: z.string().min(2).max(150).optional(),
    slug: z
      .string()
      .min(2)
      .max(200)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    excerpt: z.string().max(300).nullable().optional(),
    body: BodyMarkdown.nullable().optional(),

    status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).optional(),
    publishedAt: z.string().datetime().nullable().optional(),

    coverId: z.string().uuid().nullable().optional(),

    tagIds: z.array(z.string().uuid()).optional(),
    categoryIds: z.array(z.string().uuid()).optional(),
    formFileIds: z.array(z.string().uuid()).optional(),

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
    const words = (val.body?.content ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    if (words > 3000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "متن بیش از ۳۰۰۰ کلمه است",
        path: ["body", "content"],
      });
    }
    if (val.status === "SCHEDULED" && val.publishedAt === undefined) {
      // only warn if scheduling but timestamp not provided in patch
      // (you may allow previously-set publishedAt to stand)
    }
  });

/* ---------- GET one ---------- */
export async function GET(_req: Request, ctx: { params: Promise<IdParam> }) {
  const gate = await requireCmsAccess(_req);
  if ("error" in gate) return gate.error;

  const { id } = await ctx.params;

  const row = await prisma.service.findUnique({
    where: { id },
    include: {
      cover: { select: { id: true, publicUrl: true, alt: true } },
      media: {
        select: {
          media: { select: { id: true, publicUrl: true, alt: true } },
          order: true,
          mediaId: true,
        },
        orderBy: { order: "asc" },
      },
      tags: {
        select: {
          tagId: true,
          tag: { select: { id: true, key: true, name: true } },
        },
      },
      categories: {
        select: {
          categoryId: true,
          category: { select: { id: true, key: true, name: true } },
        },
      },
      forms: {
        select: {
          formFileId: true,
          formFile: {
            select: {
              id: true,
              title: true,
              slug: true,
              kind: true,
              previewImage: {
                select: { id: true, publicUrl: true, alt: true },
              },
              primaryFile: { select: { id: true, publicUrl: true, alt: true } },
            },
          },
        },
      },
      author: { select: { id: true, name: true } },
      updatedBy: { select: { id: true, name: true } },
    },
  });

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

/* ---------- PATCH update ---------- */
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

  // derive publishedAt: if switching to PUBLISHED and no explicit publishedAt provided,
  // set now only if it has not been set before
  let publishedAtUpdate: Date | null | undefined = undefined;
  if (body.status === "PUBLISHED" && body.publishedAt === undefined) {
    const current = await prisma.service.findUnique({
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

  try {
    await prisma.$transaction(async (tx) => {
      // update main record
      await tx.service.update({
        where: { id },
        data: {
          title: body.title ?? undefined,
          slug: body.slug ?? undefined,
          excerpt: body.excerpt ?? undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          body: (body.body ?? undefined) as any,
          status: body.status ?? undefined,
          publishedAt: publishedAtUpdate,
          coverId: body.coverId !== undefined ? body.coverId : undefined,
          updatedById: session.user.id,
        },
      });

      // replace gallery (if provided)
      if (body.gallery) {
        await tx.serviceMedia.deleteMany({ where: { serviceId: id } });
        if (body.gallery.length) {
          await tx.serviceMedia.createMany({
            data: body.gallery.map((g) => ({
              serviceId: id,
              mediaId: g.mediaId,
              order: g.order ?? 0,
            })),
            skipDuplicates: true,
          });
        }
      }

      // replace tags (if provided)
      if (body.tagIds) {
        await tx.serviceTag.deleteMany({ where: { serviceId: id } });
        if (body.tagIds.length) {
          await tx.serviceTag.createMany({
            data: body.tagIds.map((tagId) => ({ serviceId: id, tagId })),
            skipDuplicates: true,
          });
        }
      }

      // replace categories (if provided)
      if (body.categoryIds) {
        await tx.serviceCategory.deleteMany({ where: { serviceId: id } });
        if (body.categoryIds.length) {
          await tx.serviceCategory.createMany({
            data: body.categoryIds.map((categoryId) => ({
              serviceId: id,
              categoryId,
            })),
            skipDuplicates: true,
          });
        }
      }

      // replace forms (if provided)
      if (body.formFileIds) {
        await tx.serviceFormFile.deleteMany({ where: { serviceId: id } });
        if (body.formFileIds.length) {
          await tx.serviceFormFile.createMany({
            data: body.formFileIds.map((formFileId) => ({
              serviceId: id,
              formFileId,
            })),
            skipDuplicates: true,
          });
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CMS_SERVICE_UPDATE",
        targetId: id,
        meta: { status: body.status },
      },
    });
    revalidateTag("home-services");
    revalidateTag("services");
    return NextResponse.json({ ok: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    if (e?.code === "P2002") {
      // unique constraint (e.g., slug)
      return NextResponse.json({ error: "duplicate_slug" }, { status: 409 });
    }
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "related_not_found" }, { status: 400 });
    }
    throw e;
  }
}

// If you want a hard delete later, guard it tightly and consider soft-deleting instead.
// export async function DELETE(req: Request, ctx: { params: Promise<IdParam> }) { ... }
