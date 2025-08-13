import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { departmentSchema } from "@/lib/validators/org";
import { revalidateTag } from "next/cache";
import { STAFF_MANAGEMENT_ALLOWED_ROLES } from "@/config/constants/rbac";
import { Prisma } from "@prisma/client";

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

// GET /api/admin/departments -> list
export async function GET() {
  const departments = await prisma.department.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(departments);
}

// POST /api/admin/departments -> create
export async function POST(req: Request) {
  if (!(await assertAdmin(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json();
  const parsed = departmentSchema.parse(json);

  try {
    const created = await prisma.department.create({ data: parsed });
    revalidateTag("departments");
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Department with this key or name already exists." },
        { status: 409 }
      );
    }
    console.error("Department create error:", err);
    return NextResponse.json(
      { error: "Failed to create department" },
      { status: 500 }
    );
  }
}
