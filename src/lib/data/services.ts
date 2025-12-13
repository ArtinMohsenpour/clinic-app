import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Fetch all published services for the public Services page
export const getServicesPageData = unstable_cache(
  async () => {
    return prisma.service.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { order: "asc" },
      include: {
        cover: { select: { publicUrl: true, alt: true } },
      },
    });
  },
  ["services-page-data"],
  { tags: ["services"] }
);

// Fetch slugs of all published services (for static params/sitemap)
export const getServiceSlugs = unstable_cache(
  async () => {
    const rows = await prisma.service.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
      orderBy: { order: "asc" },
    });
    return rows.map((r) => r.slug);
  },
  ["service-slugs"],
  { tags: ["services"] }
);

// Fetch single published service by slug with rich relations
export const getServiceBySlug = unstable_cache(
  async (slug: string) => {
    return prisma.service.findUnique({
      where: { slug },
      include: {
        cover: { select: { publicUrl: true, alt: true } },
        media: {
          include: {
            media: { select: { publicUrl: true, alt: true } },
          },
          orderBy: { order: "asc" },
        },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });
  },
  ["service-by-slug"],
  { tags: ["services"] }
);
