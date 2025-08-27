import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCmsAccess } from "../../_auth"; // adjust relative path if needed
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const activeOnly = searchParams.get("active") === "1";

  const where: Prisma.BranchWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { key: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ];
  }
  if (activeOnly) where.isActive = true;

  const rows = await prisma.branch.findMany({
    where,
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return NextResponse.json(rows);
}
