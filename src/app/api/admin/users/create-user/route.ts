// app/api/admin/users/create-user/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { STAFF_MANAGEMENT_ALLOWED_ROLES } from "@/config/constants/rbac";

/** Require an authenticated user with a staff-management role */
async function assertAdmin(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return null;
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
  return can ? session.user.id : null;
}

// 1) Accept `fullname` too, then *transform* into a normalized `name`
const RawBodySchema = z.object({
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

  // profile fields as a nested object
  profile: z
    .object({
      secondaryEmail: z.string().email().nullable().optional(),
      locale: z.string().min(2).max(10).nullable().optional(),
      timezone: z.string().min(3).max(64).nullable().optional(),
      notifyByEmail: z.boolean().optional(),
      emergencyName: z.string().max(120).nullable().optional(),
      emergencyPhone: z.string().max(32).nullable().optional(),
    })
    .optional(),

  // initial placement (department optional; global departments)
  placement: z
    .object({
      branchId: z.string(),
      departmentId: z.string().nullable().optional(),
      isPrimary: z.boolean().optional().default(true),
      positionTitle: z.string().trim().max(120).nullable().optional(),
    })
    .optional(),
});

// Build a final `name` field from the provided variants
const BodySchema = RawBodySchema.transform((v) => {
  const combined =
    v.name?.trim() ||
    v.fullname?.trim() ||
    (v.firstName && v.lastName
      ? `${v.firstName.trim()} ${v.lastName.trim()}`
      : "");
  return { ...v, name: combined };
}).refine((v) => !!v.name, {
  message: "نام و نام خانوادگی یا فیلد نام را وارد کنید.",
  path: ["name"],
});

// Helper: trim string; empty -> null; null stays null; anything else -> undefined (no change)
const trimOrNull = (v?: string | null): string | null | undefined => {
  if (v === null) return null;
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t ? t : null;
};

export async function POST(req: Request) {
  // 🔐 admin gate
  if (!(await assertAdmin(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
    const name = body.name!; // normalized above

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

    // validate branch/department exist if placement provided
    if (body.placement?.branchId) {
      const { branchId, departmentId } = body.placement;
      const [b, d] = await Promise.all([
        prisma.branch.findUnique({
          where: { id: branchId },
          select: { id: true },
        }),
        departmentId
          ? prisma.department.findUnique({
              where: { id: departmentId },
              select: { id: true },
            })
          : Promise.resolve(null),
      ]);
      if (!b)
        return NextResponse.json({ error: "invalid_branch" }, { status: 400 });
      if (departmentId && !d)
        return NextResponse.json(
          { error: "invalid_department" },
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
    const hash = await bcrypt.hash(body.password, 12); // keep this consistent across your app
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

      // create the profile row with defaults (so self-service page always has it)
      await tx.profile.upsert({
        where: { userId },
        create: {
          userId,
          secondaryEmail: trimOrNull(body.profile?.secondaryEmail),
          locale: trimOrNull(body.profile?.locale),
          timezone: trimOrNull(body.profile?.timezone),
          notifyByEmail: body.profile?.notifyByEmail ?? true,
          emergencyName: trimOrNull(body.profile?.emergencyName),
          emergencyPhone: trimOrNull(body.profile?.emergencyPhone),
        },
        update: {
          // this branch shouldn't normally run on create, but keep idempotent
          secondaryEmail: trimOrNull(body.profile?.secondaryEmail),
          locale: trimOrNull(body.profile?.locale),
          timezone: trimOrNull(body.profile?.timezone),
          ...(body.profile?.notifyByEmail !== undefined
            ? { notifyByEmail: body.profile.notifyByEmail }
            : {}),
          emergencyName: trimOrNull(body.profile?.emergencyName),
          emergencyPhone: trimOrNull(body.profile?.emergencyPhone),
        },
      });

      // initial primary placement (department is global; optional)
      if (body.placement?.branchId) {
        await tx.userBranch.create({
          data: {
            userId,
            branchId: body.placement.branchId,
            departmentId: body.placement.departmentId ?? null,
            isPrimary: body.placement.isPrimary ?? true,
            positionTitle:
              (typeof body.placement.positionTitle === "string" &&
                body.placement.positionTitle.trim()) ||
              null,
          },
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
              branch: {
                select: { id: true, key: true, name: true, city: true },
              },
              department: { select: { id: true, key: true, name: true } },
            },
            orderBy: { assignedAt: "desc" },
          },
        },
      });
    });

    return NextResponse.json(
      {
        ok: true,
        id: created?.id, // expose id for avatar upload
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
