import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// 1. Hero Section Data
export const getHeroSlides = unstable_cache(
  async () => {
    return prisma.heroSlide.findMany({
      // FIX: Use 'status' enum instead of 'isActive'
      where: { status: "PUBLISHED" },
      orderBy: { order: "asc" },
      // Include image so we can display it
      include: {
        image: {
          select: { publicUrl: true, alt: true },
        },
      },
    });
  },
  ["home-hero"],
  { tags: ["home-hero"] }
);

// 2. Services Section Data
export const getHomeServices = unstable_cache(
  async () => {
    return prisma.service.findMany({
      take: 6,
      // FIX: Use 'status' enum
      where: { status: "PUBLISHED" },
      orderBy: { order: "asc" },
      // Include icon/cover if you have them
      include: {
        cover: { select: { publicUrl: true, alt: true } },
      },
    });
  },
  ["home-services"],
  { tags: ["home-services"] }
);

// 3. Latest Articles Data
export const getLatestArticles = unstable_cache(
  async () => {
    return prisma.article.findMany({
      take: 3,
      // FIX: Use 'status' enum instead of 'published' boolean
      where: { status: "PUBLISHED" },
      // Better to sort by publish date than creation date
      orderBy: { publishedAt: "desc" },
      include: {
        author: { select: { name: true, image: true } },
        cover: { select: { publicUrl: true, alt: true } },
        categories: { include: { category: true } },
      },
    });
  },
  ["home-articles"],
  { tags: ["home-articles"] }
);

// 4. Branches Data (Map/Footer list)
export const getHomeBranches = unstable_cache(
  async () => {
    return prisma.branch.findMany({
      take: 4,
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        city: true,
        // FIX: Select the 'cms' relation to access public contact info
        cms: {
          select: {
            phonePrimary: true,
            publicAddress: true, 
          },
        },
      },
    });
  },
  ["home-branches"],
  { tags: ["home-branches"] }
);
