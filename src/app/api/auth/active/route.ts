import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ active: false });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true },
  });

  return NextResponse.json({ active: !!user?.isActive });
}
