// src/lib/data/education.ts
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Fetch all published education articles
export const getEducationListData = unstable_cache(
  async () => {
    return prisma.education.findMany({
      where: { status: "PUBLISHED" },
      include: {
        cover: true,
        categories: { include: { category: true } },
      },
      orderBy: { publishedAt: "desc" },
    });
  },
  ["education-list"],
  { tags: ["education"] }
);

// Fetch a single article by slug
export const getEducationBySlug = unstable_cache(
  async (slug: string) => {
    return prisma.education.findUnique({
      where: { slug },
      include: {
        cover: true,
        author: true,
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        media: {
          include: {
            media: true, // Fetches the actual MediaAsset details
          },
          orderBy: { order: "asc" },
        },
      },
    });
  },
  ["education-detail"],
  { tags: ["education"] }
);
