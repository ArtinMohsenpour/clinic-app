/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/admin/specialties/[id]/route.ts
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCmsAccess } from "../../cms/_auth";
import { z } from "zod";

// در Next.js 15 پارامتر params به صورت Promise است
type Context = { params: Promise<{ id: string }> };

const PatchSchema = z.object({
  name: z
    .string()
    .min(2, "Name is too short")
    .max(100, "Name is too long")
    .optional(),
  key: z
    .string()
    .min(2, "Key is too short")
    .max(100, "Key is too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Key can only contain lowercase letters, numbers, and hyphens"
    )
    .optional(),
});

export async function PATCH(req: Request, { params }: Context) {
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;
  
  // استخراج id با استفاده از await
  const { id } = await params;

  const json = await req.json();
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { name, key } = parsed.data;
  if (!name && !key) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // Check for duplicates
  if (name || key) {
    const existing = await prisma.specialty.findFirst({
      where: {
        NOT: { id },
        OR: [...(name ? [{ name }] : []), ...(key ? [{ key }] : [])],
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A specialty with this name or key already exists." },
        { status: 409 }
      );
    }
  }

  try {
    const specialty = await prisma.specialty.update({
      where: { id },
      data: { name, key },
    });
    revalidateTag("specialties");
    return NextResponse.json(specialty);
  } catch (e) {
    return NextResponse.json(
      { error: "Specialty not found or failed to update" },
      { status: 404 }
    );
  }
}

export async function DELETE(req: Request, { params }: Context) {
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;
  
  // استخراج id با استفاده از await
  const { id } = await params;

  try {
    await prisma.specialty.delete({
      where: { id },
    });
    revalidateTag("specialties");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Specialty not found or failed to delete" },
      { status: 404 }
    );
  }
}