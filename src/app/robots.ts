import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://asr-salamat.ir";
  const base = new URL(origin);
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: new URL("/sitemap.xml", base).toString(),
    host: base.origin,
  };
}
