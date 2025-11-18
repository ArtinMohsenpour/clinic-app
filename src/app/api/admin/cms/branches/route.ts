// app/api/admin/cms/branches/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { requireCmsAccess } from "../_auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CreateSchema = z.object({
  branchId: z.string().uuid(),
  status: z
    .enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"])
    .default("DRAFT"),
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
    .optional()
    .default([]),
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
  const STATUS = ["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"] as const;

  const branchWhere: Prisma.BranchWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { key: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  if ((STATUS as readonly string[]).includes(statusRaw)) {
    const ids = await prisma.branchCMS.findMany({
      where: { status: statusRaw as (typeof STATUS)[number] },
      select: { branchId: true },
    });
    const allowed = ids.map((b) => b.branchId);
    if (!allowed.length) {
      return NextResponse.json({ page, pageSize, total: 0, items: [] });
    }
    branchWhere.id = { in: allowed };
  }

  const total = await prisma.branch.count({ where: branchWhere });

  const branches = await prisma.branch.findMany({
    where: branchWhere,
    orderBy: { createdAt: "desc" },
    skip,
    take: pageSize,
    select: { id: true, name: true, key: true, city: true },
  });

  const branchIds = branches.map((b) => b.id);
  const cmsRows = branchIds.length
    ? await prisma.branchCMS.findMany({
        where: { branchId: { in: branchIds } },
        select: {
          id: true,
          branchId: true,
          status: true,
          publishedAt: true,
          updatedAt: true,
          title: true,
        },
      })
    : [];

  const cmsByBranch = new Map(cmsRows.map((c) => [c.branchId, c]));
  const items = branches.map((b) => {
    const cms = cmsByBranch.get(b.id);
    return {
      branch: { id: b.id, name: b.name, key: b.key, city: b.city },
      cms: cms
        ? {
            id: cms.id,
            status: cms.status,
            title: cms.title,
            publishedAt: cms.publishedAt ? cms.publishedAt.toISOString() : null,
            updatedAt: cms.updatedAt.toISOString(),
          }
        : null,
    };
  });

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

  const branch = await prisma.branch.findUnique({
    where: { id: body.branchId },
    select: { id: true, isActive: true },
  });
  if (!branch)
    return NextResponse.json({ error: "branch_not_found" }, { status: 404 });
  // Optional: block CMS for inactive branches
  // if (!branch.isActive) return NextResponse.json({ error: "branch_inactive" }, { status: 409 });

  // Derive publishedAt
  const publishedAt =
    body.status === "PUBLISHED" && !body.publishedAt
      ? new Date()
      : body.publishedAt
      ? new Date(body.publishedAt)
      : null;

  try {
    const created = await prisma.branchCMS.create({
      data: {
        branchId: body.branchId,
        status: body.status,
        publishedAt,
        title: body.title ?? null,
        subtitle: body.subtitle ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: (body.body ?? null) as any,
        publicAddress: body.publicAddress ?? null,
        phonePrimary: body.phonePrimary ?? null,
        phoneSecondary: body.phoneSecondary ?? null,
        emailPublic: body.emailPublic ?? null,
        mapUrl: body.mapUrl ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        openingHours: (body.openingHours ?? null) as any,
        heroId: body.heroId ?? null,
        authorId: session.user.id,
        updatedById: session.user.id,
        media: {
          create: (body.gallery ?? []).map((g) => ({
            media: { connect: { id: g.mediaId } },
            order: g.order ?? 0,
          })),
        },
      },
      select: { id: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CMS_BRANCH_CREATE",
        targetId: created.id,
        meta: { branchId: body.branchId, status: body.status },
      },
    });

    revalidateTag("branch-cms");
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "branch_cms_exists" }, { status: 409 });
    }
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "media_not_found" }, { status: 400 });
    }
    throw e;
  }
}
