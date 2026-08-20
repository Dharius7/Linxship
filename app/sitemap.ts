import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  let siteUrl = "http://localhost:3000";
  if (configured) {
    try {
      const parsed = new URL(configured);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        siteUrl = parsed.origin;
      }
    } catch {
      // Keep the explicit development fallback when configuration is invalid.
    }
  }

  return [{ url: siteUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 }];
}
