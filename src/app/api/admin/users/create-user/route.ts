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
  specialtyId: z.string().uuid().nullable().optional(), // <-- NEW
  isActive: z.boolean().optional().default(true),
  mustChangePassword: z.boolean().optional().default(false),
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
  placement: z
    .object({
      branchId: z.string(),
      departmentId: z.string().nullable().optional(),
      isPrimary: z.boolean().optional().default(true),
      positionTitle: z.string().trim().max(120).nullable().optional(),
    })
    .optional(),
});

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

const trimOrNull = (v?: string | null): string | null | undefined => {
  if (v === null) return null;
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t ? t : null;
};

export async function POST(req: Request) {
  // if (!(await assertAdmin(req))) {
  //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // }

  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const {
      name: rawName,
      email: rawEmail,
      specialtyId,
      ...body
    } = parsed.data;
    const name = rawName!;
    const email = rawEmail.trim().toLowerCase();

    const [rolesInDb, branch, department, specialty] = await Promise.all([
      prisma.role.findMany({
        where: { id: { in: body.roles } },
        select: { id: true, key: true },
      }),
      body.placement?.branchId
        ? prisma.branch.findUnique({ where: { id: body.placement.branchId } })
        : Promise.resolve(null),
      body.placement?.departmentId
        ? prisma.department.findUnique({
            where: { id: body.placement.departmentId },
          })
        : Promise.resolve(null),
      specialtyId
        ? prisma.specialty.findUnique({ where: { id: specialtyId } })
        : Promise.resolve(null),
    ]);

    const validRoleIds = new Set(rolesInDb.map((r) => r.id));
    if (body.roles.some((id) => !validRoleIds.has(id))) {
      return NextResponse.json({ error: "invalid_roles" }, { status: 400 });
    }
    if (body.placement?.branchId && !branch) {
      return NextResponse.json({ error: "invalid_branch" }, { status: 400 });
    }
    if (body.placement?.departmentId && !department) {
      return NextResponse.json(
        { error: "invalid_department" },
        { status: 400 }
      );
    }
    const isDoctor = rolesInDb.some((r) => r.key === "doctor");
    if (isDoctor && !specialty) {
      return NextResponse.json(
        { error: "invalid_specialty_for_doctor" },
        { status: 400 }
      );
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "email_exists" }, { status: 409 });
    }

    const now = new Date();
    const hash = await bcrypt.hash(body.password, 12);
    const userId = randomUUID();

    const created = await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          name,
          email,
          phone: body.phone ?? null,
          address: body.address ?? null,
          isActive: body.isActive,
          mustChangePassword: body.mustChangePassword,
          specialtyId: isDoctor ? specialtyId : null,
          createdAt: now,
          updatedAt: now,
        },
      });

      await tx.account.create({
        data: {
          id: randomUUID(),
          userId,
          providerId: "credential",
          accountId: email,
          password: hash,
          createdAt: now,
          updatedAt: now,
        },
      });

      if (validRoleIds.size) {
        await tx.userRole.createMany({
          data: Array.from(validRoleIds).map((roleId) => ({ userId, roleId })),
        });
      }

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
        update: {},
      });

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
        select: { id: true },
      });
    });

    return NextResponse.json({ ok: true, id: created?.id }, { status: 201 });
  } catch (err) {
    console.error("create-user error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

