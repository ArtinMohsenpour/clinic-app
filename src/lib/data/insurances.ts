import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const getInsurancesPageData = unstable_cache(
  async () => {
    return prisma.insuranceCompany.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: {
        createdAt: "desc", // Or you might prefer 'name' asc
      },
      include: {
        cover: {
          select: {
            publicUrl: true,
            alt: true,
          },
        },
      },
    });
  },
  ["public-insurances-page-data"],
  { tags: ["insurances", "insurance-companies"] }
);
