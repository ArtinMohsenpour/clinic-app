import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// 1. Hero Section Data
export const getHeroSlides = unstable_cache(
  async () => {
    return prisma.heroSlide.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { order: "asc" },
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

// 1.2 StaticPages Section Data
export const getHomeStaticPages = unstable_cache(
  async () => {
    return prisma.staticPage.findMany({
      where: { status: "PUBLISHED" },
    });
  },
  ["home-static-pages"],
  { tags: ["home-static-pages", "static-pages"] }
);

// 2. Services Section Data
export const getHomeServices = unstable_cache(
  async () => {
    return prisma.service.findMany({
      take: 3,
      where: { status: "PUBLISHED" },
      orderBy: { order: "asc" },
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
      where: { status: "PUBLISHED" },
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

// 4. Branches Data
export const getHomeBranches = unstable_cache(
  async () => {
    return prisma.branch.findMany({
      take: 5,
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        city: true,
        key: true,
        cms: {
          select: {
            phonePrimary: true,
            publicAddress: true,
            hero: {
              select: {
                publicUrl: true,
                alt: true,
              },
            },
          },
        },
      },
    });
  },
  ["home-branches"],
  { tags: ["home-branches"] }
);

// 5. Insurances Data
export const getHomeInsurances = unstable_cache(
  async () => {
    return prisma.insuranceCompany.findMany({
      take: 3,
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      include: {
        cover: {
          select: { publicUrl: true, alt: true },
        },
      },
    });
  },
  ["home-insurances"],
  { tags: ["home-insurances"] }
);

// 6. Footer Data
export const getFooterData = unstable_cache(
  async () => {
    const [mainBranch] = await Promise.all([
      prisma.branch
        .findUnique({
          where: { key: "tehran-main" },
          include: { cms: true },
        })
        .then(async (branch) => {
          if (branch) return branch;
          // Fallback to first available branch if 'tehran-main' is missing
          return prisma.branch.findFirst({
            include: { cms: true },
          });
        }),
    ]);

    return { mainBranch };
  },
  ["footer-data"],
  { tags: ["footer-data", "home-branches", "static-pages"] }
);

// 7. Imprint Page Data (Specific Fetcher)
export const getImprintPage = unstable_cache(
  async () => {
    return prisma.staticPage.findUnique({
      where: { slug: "imprint" },
      include: {
        contactItems: {
          orderBy: { order: "asc" },
        },
      },
    });
  },
  ["imprint-page"],
  { tags: ["static-pages", "imprint-page"] }
);


// 8. Privacy Page Data
export const getPrivacyPage = unstable_cache(
  async () => {
    return prisma.staticPage.findUnique({
      where: { slug: "privacy" },
      include: {
        contactItems: {
          orderBy: { order: "asc" },
        },
      },
    });
  },
  ["privacy-page"],
  { tags: ["static-pages", "privacy-page"] }
);