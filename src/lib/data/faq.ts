import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const getFaqData = unstable_cache(
  async () => {
    return prisma.faq.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: [
        { isPinned: "desc" }, // Pinned items first
        { order: "asc" }, // Then manual sort order
        { createdAt: "desc" },
      ],
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });
  },
  ["faq-list-data"],
  { tags: ["faq"] }
);
