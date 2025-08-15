// app/admin/settings/organization/departments/page.tsx
import DepartmentsClient from "@/components/admin/settings/departments-client";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Cache DB result and associate it to the "departments" tag.
// Your POST/PATCH routes already call revalidateTag("departments").
const getDepartmentsCached = unstable_cache(
  async () => {
    const rows = await prisma.department.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        key: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Convert Date -> ISO string for the client type
    return rows.map((d) => ({
      id: d.id,
      name: d.name,
      key: d.key,
      isActive: d.isActive,
      createdAt: d.createdAt.toISOString(),
    }));
  },
  ["departments:list"], // cache key seed
  { tags: ["departments"] } // same tag your API revalidates
);

export default async function DepartmentsPage() {
  const departments = await getDepartmentsCached();
  return <DepartmentsClient initialData={departments} />;
}
