import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = new URL("https://asr-salamat.ir");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: new URL("/sitemap.xml", base).toString(),
    host: base.origin,
  };
}
