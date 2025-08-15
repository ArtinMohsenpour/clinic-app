import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const patchSchema = z.object({
  phone: z.string().min(5).max(32).optional(),
  address: z.string().max(300).optional(),
  secondaryEmail: z.string().email().optional(),
  locale: z.string().min(2).max(10).optional(),
  timezone: z.string().min(3).max(64).optional(),
  notifyByEmail: z.boolean().optional(),
  emergencyName: z.string().max(120).optional(),
  emergencyPhone: z.string().max(32).optional(),
});

export async function GET(req: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await auth.api.getSession({ headers: (req as any).headers });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
      address: true,
      roles: { select: { role: { select: { key: true, name: true } } } },
      profile: {
        select: {
          secondaryEmail: true,
          locale: true,
          timezone: true,
          notifyByEmail: true,
          emergencyName: true,
          emergencyPhone: true,
          avatarThumbUrl: true,
        },
      },
      documents: {
        select: {
          id: true,
          title: true,
          type: true,
          fileKey: true,
          createdAt: true,
          uploadedById: true,
        },
        orderBy: { createdAt: "desc" },
      },
      branches: {
        select: {
          isPrimary: true,
          branch: { select: { id: true, key: true, name: true } },
          department: { select: { id: true, key: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json(me);
}

export async function PATCH(req: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await auth.api.getSession({ headers: (req as any).headers });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { phone, address, ...p } = parsed.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      phone,
      address,
      profile: { upsert: { create: p, update: p } },
      auditLogs: {
        create: {
          action: "PROFILE_UPDATE",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          meta: parsed.data as any,
          targetId: session.user.id,
        },
      },
    },
  });

  return NextResponse.json({ ok: true });
}
