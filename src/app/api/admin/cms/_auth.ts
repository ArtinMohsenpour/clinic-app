// src/app/api/admin/cms/_auth.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CMS_ALLOWED_ROLES } from "@/config/constants/rbac";

export async function requireCmsAccess(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const allowed = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      roles: { some: { role: { key: { in: Array.from(CMS_ALLOWED_ROLES) } } } },
    },
    select: { id: true },
  });
  if (!allowed) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}