import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { requireCmsAccess } from "../../_auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type IdParam = { id: string };

const PatchSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  title: z.string().max(160).nullable().optional(),
  subtitle: z.string().max(240).nullable().optional(),
  body: z.unknown().nullable().optional(),
  publicAddress: z.string().max(500).nullable().optional(),
  phonePrimary: z.string().max(50).nullable().optional(),
  phoneSecondary: z.string().max(50).nullable().optional(),
  emailPublic: z.string().email().nullable().optional(),
  mapUrl: z.string().url().nullable().optional(),
  openingHours: z.unknown().nullable().optional(),
  heroId: z.string().uuid().nullable().optional(),
  gallery: z
    .array(
      z.object({
        mediaId: z.string().uuid(),
        order: z.number().int().min(0).default(0),
      })
    )
    .optional(),
});

export async function GET(req: Request, ctx: { params: Promise<IdParam> }) {
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;

  const { id } = await ctx.params;

  const row = await prisma.branchCMS.findUnique({
    where: { id },
    include: {
      branch: {
        select: { id: true, name: true, key: true, city: true, address: true },
      },
      hero: { select: { id: true, publicUrl: true, alt: true } },
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

  let publishedAtUpdate: Date | null | undefined = undefined;

  if (body.status === "PUBLISHED" && body.publishedAt === undefined) {
    const current = await prisma.branchCMS.findUnique({
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
    await tx.branchCMS.update({
      where: { id },
      data: {
        status: body.status,
        publishedAt: publishedAtUpdate,
        title: body.title ?? undefined,
        subtitle: body.subtitle ?? undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: body.body as any,
        publicAddress: body.publicAddress ?? undefined,
        phonePrimary: body.phonePrimary ?? undefined,
        phoneSecondary: body.phoneSecondary ?? undefined,
        emailPublic: body.emailPublic ?? undefined,
        mapUrl: body.mapUrl ?? undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        openingHours: body.openingHours as any,
        heroId: body.heroId !== undefined ? body.heroId : undefined,
        updatedById: session.user.id,
      },
    });

    if (body.gallery) {
      await tx.branchMedia.deleteMany({ where: { branchCmsId: id } });
      if (body.gallery.length) {
        await tx.branchMedia.createMany({
          data: body.gallery.map((g) => ({
            branchCmsId: id,
            mediaId: g.mediaId,
            order: g.order ?? 0,
          })),
          skipDuplicates: true,
        });
      }
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "CMS_BRANCH_UPDATE",
      targetId: id,
      meta: { status: body.status },
    },
  });

  revalidateTag("branches");
  revalidateTag("home-branches");
  revalidateTag("branch-cms");
  return NextResponse.json({ ok: true });
}
