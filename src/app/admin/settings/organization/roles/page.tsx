import RolesClient from "@/components/admin/settings/roles-client";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Cache DB result and associate it to the "roles" tag.
const getRolesCached = unstable_cache(
  async () => {
    const rows = await prisma.role.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        key: true,
        name: true,
        _count: { select: { users: true } }, // how many assignments
      },
    });

    return rows.map((r) => ({
      id: r.id,
      key: r.key,
      name: r.name,
      usersCount: r._count.users,
    }));
  },
  ["roles:list"],
  { tags: ["roles"] }
);

export default async function RolesPage() {
  const roles = await getRolesCached();
  return <RolesClient initialData={roles} />;
}
