import type { MetadataRoute } from "next";
import { getArticleSlugs } from "@/lib/data/articles";
import { getServiceSlugs } from "@/lib/data/services";
import { getBranchSlugs } from "@/lib/data/branches";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://asr-salamat.ir";
  const now = new Date();

  // Static routes present in the app
  const staticRoutes: string[] = [
    "/",
    "/about",
    "/services",
    "/branches",
    "/staff",
    "/privacy",
    "/imprint",
    "/articles",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));

  // Dynamic content
  const [articleSlugs, serviceSlugs, branchSlugs] = await Promise.all([
    getArticleSlugs(),
    getServiceSlugs(),
    getBranchSlugs(),
  ]);

  const articleEntries: MetadataRoute.Sitemap = articleSlugs.map((slug) => ({
    url: `${baseUrl}/articles/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const serviceEntries: MetadataRoute.Sitemap = serviceSlugs.map((slug) => ({
    url: `${baseUrl}/services/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const branchEntries: MetadataRoute.Sitemap = branchSlugs.map((key) => ({
    url: `${baseUrl}/branches/${key}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticEntries, ...articleEntries, ...serviceEntries, ...branchEntries];
}
