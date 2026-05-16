import { NextResponse } from "next/server";
import { fetchRSSFeed } from "@/lib/ingestion/rss";
import { processArticleWithAI } from "@/lib/gemini";
import { checkArticleExistsByOriginalId, saveAggregatedArticle } from "@/lib/firestore";
import type { Article } from "@/lib/types";

// Configure maximum execution time for this API route to prevent timeouts
export const maxDuration = 300; // 5 minutes

const NEWS_SOURCES = [
  { url: "https://www.eenadu.net/rss/andhra-pradesh", name: "Eenadu" },
  { url: "https://www.sakshi.com/rss/andhra-pradesh", name: "Sakshi" },
  { url: "https://www.andhrajyothy.com/rss/andhra-pradesh", name: "Andhrajyothy" },
  { url: "https://news.google.com/rss/search?q=Kamma+Community&hl=en-IN&gl=IN&ceid=IN:en", name: "Google News" },
  { url: "https://news.google.com/rss/search?q=Chandrababu+Naidu&hl=en-IN&gl=IN&ceid=IN:en", name: "Google News" }
];

export async function GET(request: Request) {
  // 1. Toggle Check
  const isEnabled = process.env.NEWS_AGGREGATION_ENABLED !== "false";
  if (!isEnabled) {
    console.log("[CRON] Aggregation is disabled via NEWS_AGGREGATION_ENABLED.");
    return NextResponse.json({ message: "Aggregation disabled" }, { status: 200 });
  }

  // 2. Stronger auth to prevent abuse
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || process.env.NEXT_PUBLIC_CRON_SECRET;
  
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${cronSecret}`) {
    console.warn(`[CRON] Unauthorized attempt. IP: ${request.headers.get("x-forwarded-for") || "unknown"}`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  console.log("[CRON] Starting News Aggregation pipeline...");

  // Acknowledge request immediately to prevent vercel timeout if possible
  // Vercel background functions are better, but standard API route can work up to maxDuration
  
  try {
    let processedCount = 0;
    let savedCount = 0;
    
    // 1. Fetch from all sources
    for (const source of NEWS_SOURCES) {
      try {
        console.log(`Fetching from: ${source.name}...`);
        const rawArticles = await fetchRSSFeed(source.url, source.name);
        
        // Limit to top 5 recent articles per source per run to avoid huge AI costs
        const recentArticles = rawArticles.slice(0, 5);
        
        for (const raw of recentArticles) {
          try {
            // Validate URL to prevent XSS/injection
            if (!raw.link.startsWith("http")) continue;

            // 2. Deduplication Check
            const exists = await checkArticleExistsByOriginalId(raw.originalId);
            if (exists) continue;
            
            // Rate limit Gemini API requests (e.g., 2 seconds between calls)
            await sleep(2000);
        
        // 3. AI Relevance & Summarization Check
        const aiResult = await processArticleWithAI(raw.title, raw.contentSnippet, raw.sourceName);
        processedCount++;
        
        if (!aiResult) continue; // AI failed
        
        // 4. Filtering: Is it relevant and safe?
        if (aiResult.isRelevant && aiResult.isSafe) {
          
          // Generate a slug
          const slug = `${raw.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`.substring(0, 100);
          
          // Trust score fallback if missing
          const trustScore = 7; // We can integrate getSourceTrustScore here later

          const articleData: Partial<Article> = {
            title: raw.title,
            titleTelugu: "", // Optional, could use AI translation if we add it
            slug,
            excerpt: aiResult.summary,
            excerptTelugu: aiResult.summaryTelugu,
            content: `<p>${aiResult.summary}</p>\n\n<p><strong><a href="${raw.link}" target="_blank" rel="noopener noreferrer">Read the full story on ${raw.sourceName}</a></strong></p>`,
            category: "Community News", // Default category
            author: { name: raw.sourceName },
            imageUrl: raw.thumbnailUrl || "https://res.cloudinary.com/dltwqn4yr/image/upload/v1778870164/default-news.jpg",
            tags: aiResult.tags,
            isFeatured: false,
            isBreaking: aiResult.importanceScore >= 8,
            viewCount: 0,
            readingTime: 2, // Default
            
            // Aggregation specifics
            isAggregated: true,
            sourceUrl: raw.link,
            sourceName: raw.sourceName,
            originalId: raw.originalId,
            approvalStatus: "pending", // Put all in queue as requested for V1
            importanceScore: aiResult.importanceScore,
            trustScore,
          };
          
          await saveAggregatedArticle(articleData);
          savedCount++;
          }
        } catch (err) {
          console.error(`Error processing article ${raw.title}:`, err);
        }
      }
      } catch (sourceErr) {
        console.error(`Failed to aggregate source ${source.name}:`, sourceErr);
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: processedCount,
      saved: savedCount,
      message: "Aggregation complete",
    });

  } catch (error) {
    console.error("Cron aggregation failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
