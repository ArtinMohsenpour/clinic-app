// app/admin/settings/organization/specialties/page.tsx
import SpecialtiesClient from "@/components/admin/settings/specialties-client";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const revalidate = 0;

const getSpecialtiesCached = unstable_cache(
  async () => {
    return prisma.specialty.findMany({
      orderBy: { createdAt: "desc" },
    });
  },
  ["specialties:list"],
  { tags: ["specialties"] }
);

export default async function SpecialtiesPage() {
  const specialties = await getSpecialtiesCached();
  return <SpecialtiesClient initialData={specialties} />;
}
