import { prisma } from "../prisma";
import { unstable_cache } from "next/cache";

/**
 * Fetches all published form files and documents.
 * Includes relations for categories, tags, and all supplemental assets.
 * Optimized for performance using Next.js unstable_cache.
 */
export const getFormsData = unstable_cache(
  async () => {
    return prisma.formFile.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        primaryFile: true,
        previewImage: true,
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        assets: {
          orderBy: {
            order: "asc",
          },
          include: {
            media: true,
          },
        },
      },
    });
  },
  ["public-forms-list-v6"],
  { tags: ["forms"] }
);
