import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Fetch all active branches for the public Branches page
export const getBranchesPageData = unstable_cache(
  async () => {
    return prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        city: true,
        key: true,
        cms: {
          select: {
            title: true,
            subtitle: true,
            publicAddress: true,
            phonePrimary: true,
            hero: { select: { publicUrl: true, alt: true } },
          },
        },
      },
    });
  },
  ["branches-page-data"],
  { tags: ["branches"] }
);

// Fetch branch keys (slugs) of all active branches (for static params/sitemap)
export const getBranchSlugs = unstable_cache(
  async () => {
    const rows = await prisma.branch.findMany({
      where: { isActive: true },
      select: { key: true },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => r.key);
  },
  ["branch-slugs"],
  { tags: ["branches"] }
);

// Fetch single branch by key with rich CMS relations
export const getBranchByKey = unstable_cache(
  async (key: string) => {
    return prisma.branch.findUnique({
      where: { key },
      select: {
        id: true,
        isActive: true,
        key: true,
        name: true,
        city: true,
        address: true,
        cms: {
          select: {
            status: true,
            title: true,
            subtitle: true,
            body: true,
            publicAddress: true,
            phonePrimary: true,
            phoneSecondary: true,
            emailPublic: true,
            mapUrl: true,
            openingHours: true,
            hero: { select: { publicUrl: true, alt: true } },
            media: {
              include: { media: { select: { publicUrl: true, alt: true } } },
              orderBy: { order: "asc" },
            },
            publishedAt: true,
          },
        },
      },
    });
  },
  ["branch-by-key"],
  { tags: ["branches"] }
);
