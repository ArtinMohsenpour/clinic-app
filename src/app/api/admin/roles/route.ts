import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { STAFF_MANAGEMENT_ALLOWED_ROLES } from "@/config/constants/rbac";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // RBAC
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
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Include assignment counts and normalize to the UI shape
  const rows = await prisma.role.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      key: true,
      name: true,
      _count: { select: { users: true } }, // users is the UserRole[] relation on Role
    },
  });

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      key: r.key,
      name: r.name,
      usersCount: r._count.users,
    }))
  );
}
