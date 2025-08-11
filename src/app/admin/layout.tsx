// app/admin/layout.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/admin/sidebar/sidebar";
import { prisma } from "@/lib/prisma";
import type { User } from "@/config/types/auth/types";
import { ROLES, type RoleId } from "@/config/constants/roles";

const KEY_ORDER = ROLES.map((r) => r.id); // RoleId[]
const ORDER_INDEX: Record<RoleId, number> = KEY_ORDER.reduce((acc, k, i) => {
  acc[k as RoleId] = i;
  return acc;
}, {} as Record<RoleId, number>);

const toRoleId = (key?: string | null): RoleId | undefined =>
  key && (KEY_ORDER as readonly string[]).includes(key)
    ? (key as RoleId)
    : undefined;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const raw = await headers();
  const session = await auth.api.getSession({ headers: raw });
  if (!session?.user?.email) redirect("/login");

  // ⬇️ NOTE: include `roles`, not `role`
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    include: {
      roles: {
        select: { role: { select: { id: true, key: true, name: true } } },
      },
    },
  });
  if (!dbUser) redirect("/login");

  // Build a stable list of roles (by key) and pick a primary one
  const roleList = dbUser.roles.map((r) => r.role).filter(Boolean);
  // Sort by your configured order in ROLES
  roleList.sort((a, b) => {
    const ak = toRoleId(a.key);
    const bk = toRoleId(b.key);
    const ai = ak ? ORDER_INDEX[ak] : Number.POSITIVE_INFINITY;
    const bi = bk ? ORDER_INDEX[bk] : Number.POSITIVE_INFINITY;
    return ai - bi;
  });

  const primary = roleList[0]; // choose first as primary
  const primaryRoleId = toRoleId(primary?.key || undefined);

  const userForClient: User = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    emailVerified: dbUser.emailVerified,
    image: dbUser.image,
    phone: dbUser.phone ?? null,
    address: dbUser.address ?? null,
    createdAt: dbUser.createdAt.toISOString(),
    updatedAt: dbUser.updatedAt.toISOString(),
    // keep legacy single-role shape for Sidebar compatibility
    role:
      primary && primaryRoleId
        ? { id: primaryRoleId, name: primary.name }
        : null,
    // (optional) if your User type allows, expose the full list for future UI:
    // roleList: roleList.map(r => ({ id: r.id, key: r.key as RoleId, name: r.name })),
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-gray-100">
      <aside className="h-fit sticky top-0">
        <div className="h-full w-64 bg-white shadow-md no-scrollbar overflow-y-auto">
          <Sidebar user={userForClient} />
        </div>
      </aside>
      <div className="flex flex-col flex-1 min-w-0">
        <main className="flex-1 overflow-y-auto no-scrollbar p-2">
          {children}
        </main>
      </div>
    </div>
  );
}
