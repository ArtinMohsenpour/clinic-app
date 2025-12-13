import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Only fetch the static "About" content
export const getAboutPageData = unstable_cache(
  async () => {
    return prisma.staticPage.findUnique({
      where: { slug: "about" },
      include: {
        contactItems: {
          orderBy: { order: "asc" },
        },
      },
    });
  },
  ["about-page-data"],
  { tags: ["static-pages", "about-page"] }
);
