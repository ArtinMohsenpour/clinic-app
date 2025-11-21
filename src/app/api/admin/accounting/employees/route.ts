import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    // Security check
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    const employees = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { employeeCode: { contains: q } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
      select: {
        id: true,
        name: true,
        image: true,
        employeeCode: true,
        roles: {
          select: {
            role: { select: { name: true } },
          },
        },
      },
    });

    // Format for frontend
    const formatted = employees.map((emp) => ({
      id: emp.id,
      name: emp.name,
      image: emp.image,
      code: emp.employeeCode,
      role: emp.roles.length > 0 ? emp.roles[0].role.name : "پرسنل",
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Employee Search Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
