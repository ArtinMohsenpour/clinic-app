// app/api/admin/cms/insurances/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCmsAccess } from "../_auth";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CreateSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).nullable().optional(),
  coverageText: z.string().max(300).nullable().optional(),
  status: z
    .enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"])
    .default("DRAFT"),
  publishedAt: z.string().datetime().nullable().optional(),
  coverId: z.string().uuid().nullable().optional(),
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

  const where: Prisma.InsuranceCompanyWhereInput = {};

  const STATUS = ["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"] as const;
  type PublishStatus = (typeof STATUS)[number];
  if ((STATUS as readonly string[]).includes(statusRaw)) {
    where.status = statusRaw as PublishStatus;
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.insuranceCompany.count({ where }),
    prisma.insuranceCompany.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true } },
        cover: { select: { id: true, publicUrl: true, alt: true } },
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

  const exists = await prisma.insuranceCompany.findUnique({
    where: { slug: body.slug },
    select: { id: true },
  });
  if (exists)
    return NextResponse.json({ error: "duplicate_slug" }, { status: 409 });

  let publishedAt: Date | null | undefined = null;
  if (body.status === "PUBLISHED" && !body.publishedAt)
    publishedAt = new Date();
  else if (body.publishedAt) publishedAt = new Date(body.publishedAt);

  const created = await prisma.insuranceCompany.create({
    data: {
      name: body.name,
      slug: body.slug,
      description: body.description ?? null,
      coverageText: body.coverageText ?? null,
      status: body.status,
      publishedAt,
      coverId: body.coverId ?? null,
      authorId: session.user.id,
      updatedById: session.user.id,
    },
    select: { id: true, slug: true, status: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "CMS_INSURANCE_CREATE",
      targetId: created.id,
      meta: { slug: created.slug, status: created.status },
    },
  });

  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}