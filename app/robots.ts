import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kammavoice.com";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/news/", "/magazine/", "/videos/"],
      disallow: ["/admin/", "/admin-login", "/api/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
