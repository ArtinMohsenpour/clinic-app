import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { branchSchema } from "@/lib/validators/org";
import { revalidateTag } from "next/cache";
import { STAFF_MANAGEMENT_ALLOWED_ROLES } from "@/config/constants/rbac";
import { Prisma } from "@prisma/client";

type P = { id: string };

async function assertAdmin(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return null;
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
  return can ? session.user.id : null;
}

// GET /api/admin/branches/[id] -> single
export async function GET(_req: Request, ctx: { params: Promise<P> }) {
  const { id } = await ctx.params;
  const branch = await prisma.branch.findUnique({ where: { id } });
  if (!branch)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(branch);
}

// PATCH /api/admin/branches/[id] -> update
export async function PATCH(req: Request, ctx: { params: Promise<P> }) {
  if (!(await assertAdmin(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const json = await req.json();
  const parsed = branchSchema.partial().parse(json);

  try {
    const updated = await prisma.branch.update({ where: { id }, data: parsed });
    revalidateTag("branches");
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return NextResponse.json(
          { error: "Branch with this key or name already exists." },
          { status: 409 }
        );
      }
      if (err.code === "P2025") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }
    console.error("Branch update error:", err);
    return NextResponse.json(
      { error: "Failed to update branch" },
      { status: 500 }
    );
  }
}
