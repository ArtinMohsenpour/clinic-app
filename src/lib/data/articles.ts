import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Fetch all published articles for the public Articles page
export const getArticlesPageData = unstable_cache(
  async () => {
    return prisma.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      include: {
        author: { select: { name: true, image: true } },
        cover: { select: { publicUrl: true, alt: true } },
      },
    });
  },
  ["articles-page-data"],
  { tags: ["articles"] }
);

// Fetch slugs of all published articles (for static params/sitemap)
export const getArticleSlugs = unstable_cache(
  async () => {
    const rows = await prisma.article.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
      orderBy: { publishedAt: "desc" },
    });
    return rows.map((r) => r.slug);
  },
  ["article-slugs"],
  { tags: ["articles"] }
);

// Fetch single published article by slug with rich relations
export const getArticleBySlug = unstable_cache(
  async (slug: string) => {
    return prisma.article.findUnique({
      where: { slug },
      include: {
        author: { select: { name: true, image: true } },
        cover: { select: { publicUrl: true, alt: true } },
        media: {
          include: { media: { select: { publicUrl: true, alt: true } } },
          orderBy: { order: "asc" },
        },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });
  },
  ["article-by-slug"],
  { tags: ["articles"] }
);
