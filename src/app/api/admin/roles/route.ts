import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { STAFF_MANAGEMENT_ALLOWED_ROLES } from "@/config/constants/rbac";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // RBAC: must have one of allowed roles
  const can = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      roles: { some: { role: { key: { in: Array.from(STAFF_MANAGEMENT_ALLOWED_ROLES) } } } },
    },
    select: { id: true },
  });
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const roles = await prisma.role.findMany({
    select: { id: true, key: true, name: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(roles);
}
