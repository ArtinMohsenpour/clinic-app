import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { STAFF_MANAGEMENT_ALLOWED_ROLES } from "@/config/constants/rbac";

const Upsert = z.object({
  key: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(80),
});

async function gate(req: Request) {
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
  return {};
}

export async function GET(req: Request) {
  const g = await gate(req);
  if ("error" in g) return g.error;

  const rows = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, key: true, name: true },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const g = await gate(req);
  if ("error" in g) return g.error;

  const json = await req.json();
  const parsed = Upsert.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  try {
    const row = await prisma.tag.create({
      data: parsed.data,
      select: { id: true, key: true, name: true },
    });
    return NextResponse.json(row, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    if (e?.code === "P2002")
      return NextResponse.json(
        { error: "duplicate_key_or_name" },
        { status: 409 }
      );
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
