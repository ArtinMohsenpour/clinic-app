import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://asr-salamat.ir";
  const now = new Date();

  // List of key static pages we have in the repo
  const routes: string[] = [
    "/",
    "/about",
    "/services",
    "/privacy",
    "/imprint",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
