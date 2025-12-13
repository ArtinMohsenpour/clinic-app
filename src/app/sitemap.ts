import type { MetadataRoute } from "next";
import { getArticleSlugs } from "@/lib/data/articles";
import { getServiceSlugs } from "@/lib/data/services";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://asr-salamat.ir";
  const now = new Date();

  // Static routes present in the app
  const staticRoutes: string[] = [
    "/",
    "/about",
    "/services",
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
  const [articleSlugs, serviceSlugs] = await Promise.all([
    getArticleSlugs(),
    getServiceSlugs(),
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

  return [...staticEntries, ...articleEntries, ...serviceEntries];
}
