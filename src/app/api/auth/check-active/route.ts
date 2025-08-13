// app/api/auth/check-active/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const u = await prisma.user.findUnique({
      where: { email: (email as string).trim().toLowerCase() },
      select: { isActive: true },
    });
    // Don’t leak user existence
    return NextResponse.json({ active: u ? !!u.isActive : true });
  } catch {
    // Fail open for UX; your middleware/layout still hard-blocks
    return NextResponse.json({ active: true });
  }
}
