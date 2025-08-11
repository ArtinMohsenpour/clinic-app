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

  // RBAC
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

  // Parse body
  const body = await req.json();
  const {
    name,
    email,
    role, // role key
    isActive,
    password, // optional: reset
    phone,
    address,
    mustChangePassword, // optional toggle
  } = body as {
    name?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
    password?: string;
    phone?: string | null;
    address?: string | null;
    mustChangePassword?: boolean;
  };

  const newEmail = email?.toLowerCase();

  // Use a transaction so user/roles/account updates stay in sync
  await prisma.$transaction(async (tx) => {
    // 1) Update scalar fields on User
    const updatedUser = await tx.user.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(newEmail ? { email: newEmail } : {}),
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

    // 2) Update single role link (clear then set)
    if (role) {
      const roleRow = await tx.role.findUnique({ where: { key: role } });
      if (!roleRow) throw new Error("Invalid role");

      await tx.userRole.deleteMany({ where: { userId: updatedUser.id } });
      await tx.userRole.create({
        data: { userId: updatedUser.id, roleId: roleRow.id },
      });
    }

    // 3) Optional password reset and/or email change on credentials account
    if (password || newEmail) {
      // Find the credentials account for this user
      const cred = await tx.account.findFirst({
        where: { userId: updatedUser.id, providerId: "credentials" },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updates: Record<string, any> = { updatedAt: new Date() };

      if (newEmail) {
        updates.accountId = newEmail; // keep accountId in sync with new email
      }

      if (password && password.length >= 8) {
        updates.password = await bcrypt.hash(password, 12);
      }

      if (cred) {
        await tx.account.update({ where: { id: cred.id }, data: updates });
      } else {
        // Create if missing (e.g., migrated user)
        await tx.account.create({
          data: {
            id: crypto.randomUUID(),
            providerId: "credentials",
            accountId: newEmail ?? updatedUser.email, // fallback to current email
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
