// app/api/admin/specialties/route.ts
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCmsAccess } from "../cms/_auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  name: z.string().min(2, "Name is too short").max(100, "Name is too long"),
  key: z
    .string()
    .min(2, "Key is too short")
    .max(100, "Key is too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Key can only contain lowercase letters, numbers, and hyphens"
    ),
});

export async function GET(req: Request) {
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;

  const specialties = await prisma.specialty.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(specialties);
}

export async function POST(req: Request) {
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;

  const json = await req.json();
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, key } = parsed.data;

  const existing = await prisma.specialty.findFirst({
    where: { OR: [{ key }, { name }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A specialty with this name or key already exists." },
      { status: 409 }
    );
  }

  const specialty = await prisma.specialty.create({
    data: { name, key },
  });

  revalidateTag("specialties");

  return NextResponse.json(specialty, { status: 201 });
}
