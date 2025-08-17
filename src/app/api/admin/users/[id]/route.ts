// src/app/api/admin/users/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { STAFF_MANAGEMENT_ALLOWED_ROLES } from "@/config/constants/rbac";
import { randomUUID } from "node:crypto";

type IdParam = { id: string };

const asString = (v: unknown) => (typeof v === "string" ? v : undefined);
const trimOrNull = (v?: string | null): string | null | undefined => {
  if (v === null) return null; // explicit clear
  if (typeof v !== "string") return undefined; // don’t touch
  const t = v.trim();
  return t ? t : null; // empty string -> null (clear)
};

export async function PUT(
  req: Request,
  ctx: { params: Promise<IdParam> } // keep your Promise style
) {
  const { id } = await ctx.params;

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

  // Basic fields (compatible with your previous shape)
  const {
    name,
    fullname,
    firstName,
    lastName,
    email,
    role, // single role key (kept as-is)
    isActive,
    password,
    phone,
    address,
    mustChangePassword,
    profile, // NEW: nested profile object
    placement,
  } = body as {
    name?: unknown;
    fullname?: unknown;
    firstName?: unknown;
    lastName?: unknown;
    email?: unknown;
    role?: string;
    isActive?: boolean;
    password?: string;
    phone?: string | null;
    address?: string | null;
    mustChangePassword?: boolean;
    profile?: Partial<{
      secondaryEmail: string | null;
      locale: string | null;
      timezone: string | null;
      notifyByEmail: boolean;
      emergencyName: string | null;
      emergencyPhone: string | null;
    }>;
    placement?: {
      branchId: string;
      departmentId?: string | null;
      isPrimary?: boolean;
      positionTitle?: string | null;
    };
  };

  const nameNormalized =
    asString(name)?.trim() ||
    asString(fullname)?.trim() ||
    (asString(firstName) || asString(lastName)
      ? `${asString(firstName)?.trim() ?? ""} ${
          asString(lastName)?.trim() ?? ""
        }`.trim()
      : undefined);

  const newEmail = asString(email)?.toLowerCase();

  // Unique email check if changing
  if (newEmail) {
    const exists = await prisma.user.findFirst({
      where: { email: newEmail, NOT: { id } },
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
      where: { id },
      data: {
        ...(nameNormalized !== undefined ? { name: nameNormalized } : {}),
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

    // Single-role replacement (kept to match your UI)
    if (role) {
      const roleRow = await tx.role.findUnique({ where: { key: role } });
      if (!roleRow) throw new Error("Invalid role");
      await tx.userRole.deleteMany({ where: { userId: updatedUser.id } });
      await tx.userRole.create({
        data: { userId: updatedUser.id, roleId: roleRow.id },
      });
    }

    // Credentials account updates (email/password)
    if (password || newEmail) {
      const cred = await tx.account.findFirst({
        where: { userId: updatedUser.id, providerId: "credential" },
      });

      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (newEmail) updates["accountId"] = newEmail;
      if (password) {
        if (password.length < 8) throw new Error("Password too short");
        updates["password"] = await bcrypt.hash(password, 12);
      }

      if (cred) {
        await tx.account.update({ where: { id: cred.id }, data: updates });
      } else {
        await tx.account.create({
          data: {
            id: randomUUID(),
            providerId: "credential",
            accountId: (newEmail ?? updatedUser.email)!,
            userId: updatedUser.id,
            password: (updates["password"] as string | undefined) ?? undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    }

    // NEW: Upsert profile from nested payload
    if (profile) {
      await tx.profile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          secondaryEmail: trimOrNull(profile.secondaryEmail),
          locale: trimOrNull(profile.locale),
          timezone: trimOrNull(profile.timezone),
          notifyByEmail: profile.notifyByEmail ?? true,
          emergencyName: trimOrNull(profile.emergencyName),
          emergencyPhone: trimOrNull(profile.emergencyPhone),
        },
        update: {
          secondaryEmail: trimOrNull(profile.secondaryEmail),
          locale: trimOrNull(profile.locale),
          timezone: trimOrNull(profile.timezone),
          // keep notifyByEmail unchanged if omitted:
          ...(profile.notifyByEmail !== undefined
            ? { notifyByEmail: profile.notifyByEmail }
            : {}),
          emergencyName: trimOrNull(profile.emergencyName),
          emergencyPhone: trimOrNull(profile.emergencyPhone),
        },
      });
    }
    if (placement?.branchId) {
      // (Optional validation like in Create)
      await tx.userBranch.deleteMany({ where: { userId: id } });
      await tx.userBranch.create({
        data: {
          userId: id,
          branchId: placement.branchId,
          departmentId: placement.departmentId ?? null,
          isPrimary: placement.isPrimary ?? true,
          positionTitle:
            (typeof placement.positionTitle === "string" &&
              placement.positionTitle.trim()) ||
            null,
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request, ctx: { params: Promise<IdParam> }) {
  const { id } = await ctx.params;

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
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      isActive: true,
      image: true,
      roles: {
        select: { role: { select: { id: true, key: true, name: true } } },
        orderBy: { roleId: "asc" },
      },
      // NEW: include profile so admin can edit it
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
      branches: {
        select: {
          isPrimary: true,
          branch: { select: { id: true, key: true, name: true, city: true } },
          department: { select: { id: true, key: true, name: true } },
        },
        orderBy: { assignedAt: "desc" },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function DELETE(req: Request, ctx: { params: Promise<IdParam> }) {
  const { id } = await ctx.params;

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

  // Safety: prevent FK issues for admin/HR uploads
  const uploadsCount = await prisma.document.count({
    where: { uploadedById: id },
  });
  if (uploadsCount > 0) {
    return NextResponse.json(
      {
        error: "cannot_delete_user_with_uploads",
        message:
          "ابتدا مالکیت مدارک آپلودشده توسط این کاربر را به شخص دیگری منتقل کنید.",
        count: uploadsCount,
      },
      { status: 409 }
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
