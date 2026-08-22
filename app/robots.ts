import type { MetadataRoute } from "next";

function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      const parsed = new URL(configured);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.origin;
    } catch {
      // Fall through to the safe local development URL.
    }
  }
  return "http://localhost:3000";
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/track", "/api"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
