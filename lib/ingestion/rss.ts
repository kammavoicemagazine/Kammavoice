import Parser from "rss-parser";
import crypto from "crypto";

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "media"],
      ["media:thumbnail", "mediaThumbnail"],
      ["enclosure", "enclosure"],
      ["description", "description"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

export interface RawArticle {
  title: string;
  link: string;
  contentSnippet: string;
  sourceName: string;
  pubDate: string;
  thumbnailUrl: string;
  originalId: string;
}

/** Generate a unique deterministic hash for an article to prevent duplicates */
export function generateArticleHash(title: string, link: string): string {
  return crypto.createHash("sha256").update(`${title.trim()}|${link.trim()}`).digest("hex");
}

/** Basic Trust Scoring for sources based on user specifications */
export async function getSourceTrustScore(sourceName: string, link: string): Promise<number> {
  const lowerSource = sourceName.toLowerCase();
  const lowerLink = link.toLowerCase();
  
  if (lowerSource.includes("eenadu") || lowerLink.includes("eenadu.net")) return 9;
  if (lowerSource.includes("sakshi") || lowerLink.includes("sakshi.com")) return 8;
  if (lowerSource.includes("andhrajyothy") || lowerSource.includes("andhra jyothy") || lowerLink.includes("andhrajyothy.com")) return 8;
  if (lowerSource.includes("google news") || lowerLink.includes("news.google.com")) return 7;
  
  return 6; // Default for other sources
}

const ALLOWED_IMAGE_HOSTS = [
  "images.unsplash.com",
  "res.cloudinary.com",
  "firebasestorage.googleapis.com",
  "lh3.googleusercontent.com",
  "eenadu.net",
  "sakshi.com",
  "sakshiresources.com",
  "andhrajyothy.com",
  "news.google.com"
];

/**
 * Validates if the image host matches Next.js configured remote patterns.
 * Falls back to default news image if not allowed, preventing runtime render crashes.
 */
// SVG placeholder that always renders — no external dependency
const DEFAULT_NEWS_IMAGE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" fill="#111"><rect width="800" height="450" fill="#1a1a1a"/><text x="400" y="210" font-family="sans-serif" font-size="20" fill="#555" text-anchor="middle">Kamma Voice</text><text x="400" y="240" font-family="sans-serif" font-size="14" fill="#444" text-anchor="middle">News Image Unavailable</text></svg>'
)}`;

export function getSafeImageUrl(url: string | undefined | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  return "";
}

/**
 * Fetch and parse an RSS feed into RawArticles with retry logic and timeout protection
 */
export async function fetchRSSFeed(url: string, sourceName: string, retries = 3, timeoutMs = 10000): Promise<RawArticle[]> {
  let attempt = 0;
  while (attempt < retries) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      console.log(`[RSS Ingestion] Fetching ${sourceName} from ${url} (Attempt ${attempt + 1}/${retries})...`);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const xml = await response.text();
      const feed = await parser.parseString(xml);
      const articles: RawArticle[] = [];

      for (const item of feed.items) {
        if (!item.title || !item.link) continue;

        // Extract best available content snippet
        const contentSnippet = item.contentSnippet || item.description || item.contentEncoded || "";
        const cleanSnippet = contentSnippet.replace(/(<([^>]+)>)/gi, "").substring(0, 500); // Strip HTML, keep 500 chars

        // Extract thumbnail — try multiple sources
        let thumbnailUrl = "";
        if (item.media && item.media.$ && item.media.$.url) {
          thumbnailUrl = item.media.$.url;
        } else if ((item as any).mediaThumbnail && (item as any).mediaThumbnail.$ && (item as any).mediaThumbnail.$.url) {
          thumbnailUrl = (item as any).mediaThumbnail.$.url;
        } else if ((item as any).enclosure && (item as any).enclosure.url && (item as any).enclosure.type?.startsWith("image")) {
          thumbnailUrl = (item as any).enclosure.url;
        } else {
          // Fallback: try to extract first img tag from content/description
          const htmlContent = item.contentEncoded || item.description || "";
          const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"'>]+)["']/);
          if (imgMatch) thumbnailUrl = imgMatch[1];
        }

        articles.push({
          title: item.title.trim(),
          link: item.link.trim(),
          contentSnippet: cleanSnippet.trim(),
          sourceName: feed.title || sourceName,
          pubDate: item.isoDate || item.pubDate || new Date().toISOString(),
          thumbnailUrl,
          originalId: generateArticleHash(item.title, item.link),
        });
      }

      console.log(`[RSS Ingestion] Successfully parsed ${articles.length} articles from ${sourceName}.`);
      return articles;
    } catch (error: unknown) {
      clearTimeout(id);
      attempt++;
      const errMsg = error instanceof Error ? error.message : String(error);
      console.warn(`[RSS Ingestion] Attempt ${attempt} failed for ${sourceName} (${url}): ${errMsg}`);
      if (attempt >= retries) {
        console.error(`[RSS Ingestion] All ${retries} attempts failed for ${sourceName} (${url})`);
        return [];
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, attempt * 1500));
    }
  }
  return [];
}
