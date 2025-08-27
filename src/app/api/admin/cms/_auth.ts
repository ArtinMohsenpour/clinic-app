// src/app/api/admin/cms/_auth.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CMS_ALLOWED_ROLES } from "@/config/constants/rbac";

type GateOk = {
  session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
};
type GateErr = { error: NextResponse };

export async function requireCmsAccess(
  req: Request
): Promise<GateOk | GateErr> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Optional bypass for local/dev
  if (process.env.SKIP_RBAC === "1") return { session };

  const uid = session.user.id;

  // Case-insensitive match against allowed role keys, using user_role → role.key
  const allowedKeys = Array.from(CMS_ALLOWED_ROLES);
  const ok = await prisma.userRole.findFirst({
    where: {
      userId: uid,
      OR: allowedKeys.map((k) => ({
        role: { key: { equals: k, mode: "insensitive" } },
      })),
    },
    select: { userId: true },
  });

  if (!ok) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session };
}
