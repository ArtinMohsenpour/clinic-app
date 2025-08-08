// app/(auth)/signup/page.tsx (or wherever this file is)
import { SignUpForm } from "@/components/auth/signup-form";
import { prisma } from "@/lib/prisma";
import { ROLES, type RoleId } from "@/config/constants/roles";

const ROLE_ID_SET = new Set(ROLES.map((r) => r.id));
function isRoleId(id: string): id is RoleId {
  return ROLE_ID_SET.has(id as RoleId);
}

export default async function SignupPage() {
  const rolesDb = await prisma.role.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Narrow to RoleId + optionally filter out any unexpected DB rows
  const roles = rolesDb
    .filter((r) => isRoleId(r.id))
    .map((r) => ({ id: r.id as RoleId, name: r.name }));

  // (optional) If you want to fail loudly instead of filtering:
  // const unknown = rolesDb.filter(r => !isRoleId(r.id));
  // if (unknown.length) console.warn("Unknown roles in DB:", unknown);

  return <SignUpForm roles={roles} />;
}
