import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { z } from "zod";

const roleSchema = z.object({
  name: z.string().min(2).optional(),
  key: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const body = await _req.json();
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "invalid body" }, { status: 400 });

  try {
    await prisma.role.update({ where: { id: params.id }, data: parsed.data });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "کلید یا نام تکراری است" },
        { status: 409 }
      );
    }
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "نقش یافت نشد" }, { status: 404 });
    }
    return NextResponse.json({ error: "خطای غیرمنتظره" }, { status: 500 });
  }

  revalidateTag("roles");
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  // prevent deleting a role that has assignments
  const count = await prisma.userRole.count({ where: { roleId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: "این نقش به کاربر(ان) اختصاص داده شده و قابل حذف نیست" },
      { status: 409 }
    );
  }

  try {
    await prisma.role.delete({ where: { id } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "نقش یافت نشد" }, { status: 404 });
    }
    return NextResponse.json({ error: "خطای غیرمنتظره" }, { status: 500 });
  }

  revalidateTag("roles");
  return NextResponse.json({ ok: true });
}
