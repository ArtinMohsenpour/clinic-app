// app/api/dev/check-credential/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get("email") || "").trim().toLowerCase();

  if (!email)
    return NextResponse.json({ error: "missing email" }, { status: 400 });

  const acct = await prisma.account.findFirst({
    where: { providerId: "credential", accountId: email },
    include: { user: { select: { id: true, email: true } } },
  });

  return NextResponse.json({
    found: !!acct,
    account: acct && {
      id: acct.id,
      providerId: acct.providerId,
      accountId: acct.accountId,
      userId: acct.userId,
      hasPassword: !!acct.password,
    },
  });
}
