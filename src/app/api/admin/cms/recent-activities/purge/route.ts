import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { STAFF_MANAGEMENT_ALLOWED_ROLES } from "@/config/constants/rbac";
import type { Prisma } from "@prisma/client";

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

export async function POST(req: Request) {
  const gate = await requireCMS(req);
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const olderThanDaysRaw = Number(body?.olderThanDays ?? 30);
  const olderThanDays = Number.isFinite(olderThanDaysRaw)
    ? olderThanDaysRaw
    : 30;
  const days = Math.max(1, Math.min(3650, olderThanDays)); // clamp 1..3650
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const action = typeof body?.action === "string" ? body.action : undefined;

  // ✅ ensure we filter by date (and optional action)
  const where: Prisma.AuditLogWhereInput = {
    createdAt: { lt: cutoff },
    ...(action ? { action } : {}),
  };

  const { count } = await prisma.auditLog.deleteMany({ where });

  return NextResponse.json({
    ok: true,
    deleted: count,
    cutoff: cutoff.toISOString(),
    filteredByAction: action ?? null,
  });
}
