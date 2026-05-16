import Parser from "rss-parser";
import crypto from "crypto";

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "media"],
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

/** Basic Trust Scoring for sources */
export function getSourceTrustScore(sourceName: string, link: string): number {
  const trustedDomains = ["eenadu.net", "thehindu.com", "timesofindia.indiatimes.com", "sakshi.com", "andhrajyothy.com", "namasthetelangana.com"];
  const domainMatch = trustedDomains.find(d => link.includes(d));
  
  if (domainMatch) return 9; // High trust for established media
  if (link.includes("news.google.com")) return 8; // Google News aggregator
  
  return 6; // Default for unknown blogs/sites
}

/**
 * Fetch and parse an RSS feed into RawArticles
 */
export async function fetchRSSFeed(url: string, sourceName: string): Promise<RawArticle[]> {
  try {
    const feed = await parser.parseURL(url);
    const articles: RawArticle[] = [];

    for (const item of feed.items) {
      if (!item.title || !item.link) continue;

      // Extract best available content snippet
      const contentSnippet = item.contentSnippet || item.description || item.contentEncoded || "";
      const cleanSnippet = contentSnippet.replace(/(<([^>]+)>)/gi, "").substring(0, 500); // Strip HTML, keep 500 chars

      // Extract thumbnail
      let thumbnailUrl = "";
      if (item.media && item.media.$ && item.media.$.url) {
        thumbnailUrl = item.media.$.url;
      } else {
        // Fallback: try to extract first img tag from content
        const imgMatch = (item.contentEncoded || item.description || "").match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch) thumbnailUrl = imgMatch[1];
      }

      articles.push({
        title: item.title,
        link: item.link,
        contentSnippet: cleanSnippet,
        sourceName: feed.title || sourceName,
        pubDate: item.isoDate || item.pubDate || new Date().toISOString(),
        thumbnailUrl,
        originalId: generateArticleHash(item.title, item.link),
      });
    }

    return articles;
  } catch (error) {
    console.error(`Error fetching RSS feed from ${url}:`, error);
    return [];
  }
}
