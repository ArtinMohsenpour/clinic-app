import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

import { ACTIVITY_ALLOWED_ROLES  } from "@/config/constants/rbac";
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function requireAudit(req: Request) {
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
        some: { role: { key: { in: Array.from(ACTIVITY_ALLOWED_ROLES ) } } },
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

export async function GET(req: Request) {
  const gate = await requireAudit(req);
  if ("error" in gate) return gate.error;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const action = (searchParams.get("action") ?? "").trim();
  const from = (searchParams.get("from") ?? "").trim(); // yyyy-mm-dd
  const to = (searchParams.get("to") ?? "").trim(); // yyyy-mm-dd
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10))
  );
  const skip = (page - 1) * pageSize;

  // ✅ Use Prisma.AuditLogWhereInput
  const where: Prisma.AuditLogWhereInput = {};

  if (action) where.action = action;

  if (q) {
    where.OR = [
      { action: { contains: q, mode: "insensitive" } },
      { targetId: { contains: q, mode: "insensitive" } },
      // relation filter must be wrapped in `is: { ... }`
      { actor: { is: { name: { contains: q, mode: "insensitive" } } } },
      { actor: { is: { email: { contains: q, mode: "insensitive" } } } },
    ];
  }

  if (from || to) {
    const range: Prisma.DateTimeFilter = {};
    if (from) range.gte = new Date(from + "T00:00:00");
    if (to) {
      const end = new Date(to + "T00:00:00");
      end.setDate(end.getDate() + 1); // inclusive end day
      range.lt = end;
    }
    where.createdAt = range;
  }

  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        action: true,
        createdAt: true,
        targetId: true,
        meta: true,
        actor: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return NextResponse.json({
    page,
    pageSize,
    total,
    items: items.map((r) => ({
      id: r.id,
      action: r.action,
      createdAt: r.createdAt.toISOString(),
      targetId: r.targetId,
      meta: r.meta,
      actor: r.actor,
    })),
  });
}
