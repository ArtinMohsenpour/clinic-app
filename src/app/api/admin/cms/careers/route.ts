// src/app/api/admin/cms/careers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { CareerStatus } from "@prisma/client";
import { requireCmsAccess } from "../_auth";

// Force dynamic to ensure auth checks happen on every request
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Validation schema for creating a new career
const CreateSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(10000).nullable().optional(), // Larger max for rich text
  department: z.string().max(100).nullable().optional(),
  location: z.string().max(100).nullable().optional(),
  employmentType: z
    .enum(["FULL_TIME", "PART_TIME", "CONTRACT"])
    .default("FULL_TIME"),
  requirements: z.string().max(10000).nullable().optional(),
  status: z.enum(["DRAFT", "OPEN", "CLOSED"]).default("DRAFT"),
});

// GET: List careers with filtering and pagination
export async function GET(req: Request) {
  // 1. Auth Check
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;

  // 2. Parse Query Params
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10))
  );
  const skip = (page - 1) * pageSize;

  const q = (searchParams.get("q") ?? "").trim();
  const statusRaw = (searchParams.get("status") ?? "").trim().toUpperCase();
  const department = (searchParams.get("department") ?? "").trim();

  // 3. Build Where Clause
  const where: Prisma.CareerWhereInput = {};

  // Safe enum check
  if ((Object.values(CareerStatus) as string[]).includes(statusRaw)) {
    where.status = statusRaw as CareerStatus;
  }

  if (department) {
    where.department = { contains: department, mode: "insensitive" };
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
    ];
  }

  // 4. Database Query
  const [total, items] = await Promise.all([
    prisma.career.count({ where }),
    prisma.career.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        department: true,
        location: true,
        employmentType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true } },
        _count: { select: { applications: true } }, // Count applicants
      },
    }),
  ]);

  return NextResponse.json({ page, pageSize, total, items });
}

// POST: Create a new career
export async function POST(req: Request) {
  // 1. Auth Check
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;
  const { session } = gate;

  // 2. Parse & Validate Body
  const json = await req.json();
  const parsed = CreateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const body = parsed.data;

  // 3. Create Record
  const created = await prisma.career.create({
    data: {
      title: body.title,
      description: body.description,
      department: body.department,
      location: body.location,
      employmentType: body.employmentType,
      requirements: body.requirements,
      status: body.status,
      authorId: session.user.id,
      updatedById: session.user.id,
    },
    select: { id: true },
  });

  // 4. Audit Log
  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "CMS_CAREER_CREATE",
      targetId: created.id,
      meta: { title: body.title, status: body.status },
    },
  });

  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
