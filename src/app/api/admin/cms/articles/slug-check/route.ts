import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { STAFF_MANAGEMENT_ALLOWED_ROLES } from "@/config/constants/rbac";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const slug = (searchParams.get("slug") ?? "").trim();
  const excludeId = (searchParams.get("excludeId") ?? "").trim();

  if (!slug) return NextResponse.json({ error: "missing_slug" }, { status: 400 });

  const exists = await prisma.article.findFirst({
    where: excludeId ? { slug, NOT: { id: excludeId } } : { slug },
    select: { id: true },
  });

  return NextResponse.json({ exists: Boolean(exists) });
}
