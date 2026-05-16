import { MetadataRoute } from "next";
import { getArticles, getMagazines } from "@/lib/firestore";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kammavoice.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Base static routes
  const routes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}`, lastModified: new Date(), changeFrequency: "always", priority: 1 },
    { url: `${BASE_URL}/news`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/magazine`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/gallery`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/videos`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    // Dynamic Article Routes
    const articles = await getArticles(100);
    const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
      url: `${BASE_URL}/news/${article.slug}`,
      lastModified: new Date(article.updatedAt || article.createdAt),
      changeFrequency: "never",
      priority: 0.7,
    }));

    // Dynamic Magazine Routes
    const magazines = await getMagazines(50);
    const magazineRoutes: MetadataRoute.Sitemap = magazines.map((mag) => ({
      url: `${BASE_URL}/magazine/${mag.id}`,
      lastModified: new Date(mag.updatedAt || mag.createdAt),
      changeFrequency: "never",
      priority: 0.8,
    }));

    return [...routes, ...articleRoutes, ...magazineRoutes];
  } catch (error) {
    console.error("Failed to generate sitemap dynamics:", error);
    return routes;
  }
}
