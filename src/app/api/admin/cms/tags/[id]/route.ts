/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { STAFF_MANAGEMENT_ALLOWED_ROLES } from "@/config/constants/rbac";

const Patch = z.object({
  key: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  name: z.string().min(2).max(80).optional(),
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // تغییر به Promise
) {
  const { id } = await params; // استخراج id با await
  const g = await gate(req);
  if ("error" in g) return g.error;

  const json = await req.json();
  const parsed = Patch.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  try {
    await prisma.tag.update({ where: { id: id }, data: parsed.data });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2002")
      return NextResponse.json(
        { error: "duplicate_key_or_name" },
        { status: 409 }
      );
    if (e?.code === "P2025")
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // تغییر به Promise
) {
  const { id } = await params; // استخراج id با await
  const g = await gate(req);
  if ("error" in g) return g.error;

  const inUse = await prisma.articleTag.count({ where: { tagId: id } });
  if (inUse > 0) return NextResponse.json({ error: "in_use" }, { status: 409 });

  try {
    await prisma.tag.delete({ where: { id: id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025")
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
