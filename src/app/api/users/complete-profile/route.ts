// app/api/users/complete-profile/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const BodySchema = z.object({
  // Target user (one of these must be provided)
  userId: z.string().optional(),
  email: z.string().email().optional(),

  // Profile fields (optional)
  name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().min(0).max(50).optional(), // allow empty string to clear
  address: z.string().trim().min(0).max(200).optional(), // allow empty string to clear
  image: z.string().url().optional(),

  // Role assignment (required in this flow)
  role: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, email, name, phone, address, image, role } = parsed.data;

    // Require a target: userId or email
    if (!userId && !email) {
      return NextResponse.json(
        {
          error: "missing_target",
          message: "Provide userId or email to update.",
        },
        { status: 400 }
      );
    }

    // Resolve target by id OR email
    const targetUser = userId
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true },
        })
      : await prisma.user.findUnique({
          where: { email: email! },
          select: { id: true },
        });

    if (!targetUser) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    // Build typed update payload
    const data: Prisma.UserUpdateInput = {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(address !== undefined && { address: address || null }),
      ...(image !== undefined && { image }),
    };

    // Set/replace role via relation
    data.role = { connect: { id: role } };

    const updated = await prisma.user.update({
      where: { id: targetUser.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        image: true,
        role: { select: { id: true, name: true } },
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, user: updated }, { status: 200 });
  } catch (err) {
    console.error("complete-profile error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
