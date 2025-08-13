import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { departmentSchema } from "@/lib/validators/org";
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

// GET /api/admin/departments/[id] -> single
export async function GET(_req: Request, ctx: { params: Promise<P> }) {
  const { id } = await ctx.params;
  const dept = await prisma.department.findUnique({ where: { id } });
  if (!dept) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(dept);
}

// PATCH /api/admin/departments/[id] -> update
export async function PATCH(req: Request, ctx: { params: Promise<P> }) {
  if (!(await assertAdmin(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const json = await req.json();
  const parsed = departmentSchema.partial().parse(json);

  try {
    const updated = await prisma.department.update({
      where: { id },
      data: parsed,
    });
    revalidateTag("departments");
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return NextResponse.json(
          { error: "Department with this key or name already exists." },
          { status: 409 }
        );
      }
      if (err.code === "P2025") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }
    console.error("Department update error:", err);
    return NextResponse.json(
      { error: "Failed to update department" },
      { status: 500 }
    );
  }
}
