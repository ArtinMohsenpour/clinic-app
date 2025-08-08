// app/admin/layout.tsx (your file)
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/admin/sidebar/sidebar";
import { prisma } from "@/lib/prisma";
import type { User } from "@/config/types/auth/types";
import { ROLES, type RoleId } from "@/config/constants/roles";

const ROLE_ID_SET = new Set<RoleId>(ROLES.map((r) => r.id));
const toRoleId = (id?: string | null): RoleId | undefined =>
  id && ROLE_ID_SET.has(id as RoleId) ? (id as RoleId) : undefined;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const raw = await headers();
  const session = await auth.api.getSession({ headers: raw });
  if (!session?.user?.email) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { role: true },
  });
  if (!dbUser) redirect("/login");

  const roleId = toRoleId(dbUser.role?.id);

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
    role: dbUser.role && roleId ? { id: roleId, name: dbUser.role.name } : null,
  };

  return (
    // Prevent page-level scroll; we’ll scroll only the content pane
    <div className="flex h-dvh overflow-hidden bg-gray-100">
      {/* Sidebar: stuck to the left, full height; if it ever overflows, it can scroll without showing a bar */}
      <aside className="sticky top-0 h-dvh shrink-0">
        <div className="h-full w-64 bg-white shadow-md no-scrollbar overflow-y-auto">
          <Sidebar user={userForClient} />
        </div>
      </aside>

      {/* Content column: this is the only scrollable region */}
      <div className="flex flex-col flex-1 min-w-0">
        <main className="flex-1 overflow-y-auto no-scrollbar p-2">
          {children}
        </main>
      </div>
    </div>
  );
}
