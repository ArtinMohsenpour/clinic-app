// app/(auth)/signup/page.tsx
import SignupForm from "@/components/auth/signup-form";
import { prisma } from "@/lib/prisma";
import { ROLES, type RoleId } from "@/config/constants/roles";

export const revalidate = 0;

const KEY_SET = new Set<RoleId>(ROLES.map((r) => r.id) as RoleId[]);

export default async function SignupPage() {
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

  return <SignupForm roles={roles} />;
}
