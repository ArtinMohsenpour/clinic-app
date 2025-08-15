// app/admin/settings/organization/branches/page.tsx
import BranchesClient from "@/components/admin/settings/branches-client";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Cache DB result and associate it to the "branches" tag.
// Your POST/PATCH routes already call revalidateTag("branches").
const getBranchesCached = unstable_cache(
  async () => {
    return prisma.branch.findMany({
      orderBy: { createdAt: "desc" },
      // select the fields your client uses (optional but nice):
      // select: { id: true, name: true, key: true, city: true, timezone: true, isActive: true, createdAt: true },
    });
  },
  ["branches:list"], // cache key seed
  { tags: ["branches"] } // hook it to the same tag used by your API
);

export default async function BranchesPage() {
  const branches = await getBranchesCached();
  return <BranchesClient initialData={branches} />;
}
