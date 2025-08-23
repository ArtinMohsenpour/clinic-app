// app/admin/staff-management/create-user/page.tsx
import SignupForm from "@/components/auth/signup-form";
import { prisma } from "@/lib/prisma";
import { ROLES, type RoleId } from "@/config/constants/roles";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { STAFF_MANAGEMENT_ALLOWED_ROLES } from "@/config/constants/rbac";
import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";

export const revalidate = 0;

const KEY_SET = new Set<RoleId>(ROLES.map((r) => r.id) as RoleId[]);

export default async function CreateUserPage() {
  const raw = await headers();
  const session = await auth.api.getSession({ headers: raw });
  if (!session?.user) redirect("/login");

  const canCreate = await prisma.user.findFirst({
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

  if (!canCreate) {
    redirect("/admin/staff-management?denied=create-user");
  }

  const rolesDb = await prisma.role.findMany({
    select: { id: true, name: true, key: true }, // <-- include key
    orderBy: { name: "asc" },
  });

  // keep only known keys; pass DB id for linking, keep key for display/search
  const roles = rolesDb
    .filter((r) => KEY_SET.has(r.key as RoleId))
    .map((r) => ({ id: r.id, name: r.name, key: r.key }));

  // Optional: warn about unexpected keys in DB
  const unknown = rolesDb.filter((r) => !KEY_SET.has(r.key as RoleId));
  if (unknown.length) {
    console.warn(
      "Unknown roles in DB:",
      unknown.map((u) => u.key)
    );
  } // <-- id = UUID, key = "admin"

  return (
    <div className="space-y-4">
      <CmsBreadcrumbs
        items={[
          { label: "مدیریت کارکنان", href: "/admin/staff-management" },
          { label: "ایجاد کاربر جدید", href: "/admin/create-user" },
        ]}
      />
      <SignupForm roles={roles} />
    </div>
  );
}
