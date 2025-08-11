import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { STAFF_MANAGEMENT_ALLOWED_ROLES } from "@/config/constants/rbac";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const can = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      roles: {
        some: {
          role: { key: { in: Array.from(STAFF_MANAGEMENT_ALLOWED_ROLES) } },
        },
      },
    },
    select: { id: true },
  });
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    firstName, // from UI (optional)
    lastName, // from UI (optional)
    email,
    role,
    isActive,
    password,
    phone,
    address,
    mustChangePassword,
  } = body as {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
    password?: string;
    phone?: string | null;
    address?: string | null;
    mustChangePassword?: boolean;
  };

  // combine to "name" only if either part was provided
  const nameCombined =
    firstName !== undefined || lastName !== undefined
      ? `${(firstName ?? "").trim()} ${(lastName ?? "").trim()}`.trim()
      : undefined;

  const newEmail = email?.toLowerCase();

  if (newEmail) {
    const exists = await prisma.user.findFirst({
      where: { email: newEmail, NOT: { id: params.id } },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json(
        { error: "این ایمیل قبلاً ثبت شده است." },
        { status: 409 }
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: params.id },
      data: {
        ...(nameCombined !== undefined ? { name: nameCombined } : {}), // <-- map to DB
        ...(newEmail !== undefined ? { email: newEmail } : {}),
        ...(typeof isActive === "boolean" ? { isActive } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(typeof mustChangePassword === "boolean"
          ? { mustChangePassword }
          : {}),
        updatedAt: new Date(),
      },
      select: { id: true, email: true },
    });

    if (role) {
      const roleRow = await tx.role.findUnique({ where: { key: role } });
      if (!roleRow) throw new Error("Invalid role");
      await tx.userRole.deleteMany({ where: { userId: updatedUser.id } });
      await tx.userRole.create({
        data: { userId: updatedUser.id, roleId: roleRow.id },
      });
    }

    if (password || newEmail) {
      const cred = await tx.account.findFirst({
        where: { userId: updatedUser.id, providerId: "credential" },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updates: Record<string, any> = { updatedAt: new Date() };
      if (newEmail) updates.accountId = newEmail;
      if (password) {
        if (password.length < 8) throw new Error("Password too short");
        updates.password = await bcrypt.hash(password, 12);
      }

      if (cred) {
        await tx.account.update({ where: { id: cred.id }, data: updates });
      } else {
        await tx.account.create({
          data: {
            id: crypto.randomUUID(), // <-- must be INSIDE data
            providerId: "credential",
            accountId: newEmail ?? updatedUser.email,
            userId: updatedUser.id,
            password: updates.password ?? undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const can = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      roles: {
        some: {
          role: { key: { in: Array.from(STAFF_MANAGEMENT_ALLOWED_ROLES) } },
        },
      },
    },
    select: { id: true },
  });
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      isActive: true,
      image: true, // if you have it; safe to keep
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}
