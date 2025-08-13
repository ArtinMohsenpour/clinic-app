// app/api/admin/users/create-user/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

// 1) Accept `fullname` too, then *transform* into a normalized `name`
const RawBodySchema = z.object({
  // allow any of these to be sent:
  fullname: z.string().trim().optional(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  name: z.string().trim().optional(),

  email: z.string().email(),
  password: z.string().min(8),

  phone: z.string().trim().max(50).nullable().optional(),
  address: z.string().trim().max(200).nullable().optional(),
  image: z.string().url().optional(),
  roles: z.array(z.string()).min(1, "حداقل یک نقش را انتخاب کنید."),

  isActive: z.boolean().optional().default(true),
  mustChangePassword: z.boolean().optional().default(false),
});

// Build a final `name` field from the provided variants
const BodySchema = RawBodySchema
  .transform((v) => {
    const combined =
      v.name?.trim() ||
      v.fullname?.trim() ||
      ((v.firstName && v.lastName)
        ? `${v.firstName.trim()} ${v.lastName.trim()}`
        : "");
    return { ...v, name: combined };
  })
  .refine((v) => !!v.name, {
    message: "نام و نام خانوادگی یا فیلد نام را وارد کنید.",
    path: ["name"],
  });

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const body = parsed.data;

    const email = body.email.trim().toLowerCase();
    const name = body.name; // ✅ already normalized by the schema

    // validate roles exist
    const rolesInDb = await prisma.role.findMany({
      where: { id: { in: body.roles } },
      select: { id: true },
    });
    const valid = new Set(rolesInDb.map((r) => r.id));
    const invalid = body.roles.filter((id) => !valid.has(id));
    if (invalid.length) {
      return NextResponse.json(
        { error: "invalid_roles", invalid },
        { status: 400 }
      );
    }

    // ensure email unique
    const exists = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json({ error: "email_exists" }, { status: 409 });
    }

    const now = new Date();
    const hash = await bcrypt.hash(body.password, 10);
    const userId = randomUUID();

    const created = await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          name,
          email,
          emailVerified: false,
          image: body.image,
          phone: body.phone ?? null,
          address: body.address ?? null,
          isActive: body.isActive,
          mustChangePassword: body.mustChangePassword,
          createdAt: now,
          updatedAt: now,
        },
      });

      await tx.account.create({
        data: {
          id: randomUUID(),
          userId,
          providerId: "credential",
          accountId: email, // already lowercased
          password: hash,
          createdAt: now,
          updatedAt: now,
        },
      });

      if (valid.size) {
        await tx.userRole.createMany({
          data: Array.from(valid).map((roleId) => ({ userId, roleId })),
          skipDuplicates: true,
        });
      }

      return tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          image: true,
          isActive: true,
          mustChangePassword: true,
          createdAt: true,
          updatedAt: true,
          roles: {
            select: { role: { select: { id: true, key: true, name: true } } },
            orderBy: { roleId: "asc" },
          },
        },
      });
    });

    return NextResponse.json(
      {
        ok: true,
        id: created?.id, // ✅ expose id for avatar upload
        user: { ...created, roleList: created?.roles.map((r) => r.role) },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err) {
      const code = (err as { code?: string }).code;
      if (code === "P2002") {
        return NextResponse.json(
          { error: "unique_constraint_violation" },
          { status: 409 }
        );
      }
    }
    if (process.env.NODE_ENV !== "production") {
      console.error("create-user error:", err);
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
