import { NextResponse } from "next/server";
import { fetchRSSFeed, getSourceTrustScore, getSafeImageUrl } from "@/lib/ingestion/rss";
import { processArticleWithAI, fallbackProcessArticle } from "@/lib/gemini";
import { 
  adminCheckArticleExistsByOriginalId as checkArticleExistsByOriginalId, 
  adminSaveAggregatedArticle as saveAggregatedArticle, 
  adminSeedCategories as seedCategories 
} from "@/lib/firestore-admin-operations";
import type { Article } from "@/lib/types";

// Configure maximum execution time for this API route to prevent timeouts
export const maxDuration = 300; // 5 minutes

const NEWS_SOURCES = [
  { url: "https://www.eenadu.net/rss/andhra-pradesh", name: "Eenadu" },
  { url: "https://www.sakshi.com/rss/andhra-pradesh", name: "Sakshi" },
  { url: "https://www.andhrajyothy.com/rss/andhra-pradesh", name: "Andhrajyothy" },
  { url: "https://news.google.com/rss/search?q=Kamma+Community&hl=en-IN&gl=IN&ceid=IN:en", name: "Google News - Kamma Community" },
  { url: "https://news.google.com/rss/search?q=Chandrababu+Naidu&hl=en-IN&gl=IN&ceid=IN:en", name: "Google News - Chandrababu Naidu" },
  { url: "https://news.google.com/rss/search?q=Amaravati+Development&hl=en-IN&gl=IN&ceid=IN:en", name: "Google News - Amaravati Development" },
  { url: "https://news.google.com/rss/search?q=Andhra+Pradesh+Development&hl=en-IN&gl=IN&ceid=IN:en", name: "Google News - AP Development" },
  { url: "https://news.google.com/rss/search?q=Nara+Lokesh&hl=en-IN&gl=IN&ceid=IN:en", name: "Google News - Nara Lokesh" }
];

async function decodeGoogleNewsUrl(googleRssUrl: string): Promise<string> {
  try {
    const res = await fetch(googleRssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!res.ok) return googleRssUrl;
    
    const html = await res.text();
    const match = html.match(/<c-wiz[^>]+data-p=["']([^"']+)["']/i);
    if (!match) return googleRssUrl;
    
    const dataPStr = match[1].replace(/&quot;/g, '"');
    const obj = JSON.parse(dataPStr.replace('%.@.', '["garturlreq",'));
    
    const reqData = [
      [
        'Fbv4je',
        JSON.stringify([...obj.slice(0, -6), ...obj.slice(-2)]),
        null,
        'generic'
      ]
    ];
    
    const payload = new URLSearchParams({
      'f.req': JSON.stringify([reqData])
    });
    
    const postRes = await fetch('https://news.google.com/_/DotsSplashUi/data/batchexecute', {
      method: 'POST',
      body: payload.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!postRes.ok) return googleRssUrl;
    
    const postText = await postRes.text();
    const cleanedText = postText.replace(/^\)\]\}'\n/, "");
    const parsedData = JSON.parse(cleanedText);
    const arrayString = parsedData[0][2];
    const decodedUrl = JSON.parse(arrayString)[1];
    
    return decodedUrl || googleRssUrl;
  } catch (err) {
    console.error("[CRON] Error decoding Google News URL:", err);
    return googleRssUrl;
  }
}

async function fetchOpenGraphImage(url: string, timeoutMs = 4000): Promise<string> {
  if (!url) return "";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
      }
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) return "";
    
    const html = await response.text();
    const ogMatch = html.match(/<meta\s+[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
                    html.match(/<meta\s+[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
                         
    if (ogMatch) {
      const imgUrl = ogMatch[1].trim();
      return imgUrl.replace(/&amp;/g, '&');
    }
  } catch (error) {
    // Suppress console spam for expected network issues
  } finally {
    clearTimeout(timeoutId);
  }
  return "";
}

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

  // Auto-seed required categories if they don't exist in Firestore
  try {
    await seedCategories();
  } catch (seedErr) {
    console.error("[CRON] Failed to auto-seed categories:", seedErr);
  }

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  console.log("[CRON] Starting News Aggregation pipeline...");

  let rssFetchCount = 0;
  let processedCount = 0;
  let skippedDuplicatesCount = 0;
  let savedCount = 0;
  let aiFailuresCount = 0;
  let skippedInvalidCount = 0;
  let isGeminiAvailable = true;

  try {
    // 1. Fetch from all sources
    for (const source of NEWS_SOURCES) {
      try {
        console.log(`[CRON] Fetching feed for ${source.name}...`);
        const rawArticles = await fetchRSSFeed(source.url, source.name);
        rssFetchCount += rawArticles.length;

        // Limit to top 5 recent articles per source per run to avoid huge AI costs
        const recentArticles = rawArticles.slice(0, 5);
        
        for (const raw of recentArticles) {
          try {
            // Validate URL and title to prevent XSS/injection and skip invalid/broken entries
            if (!raw.link || !raw.link.startsWith("http") || !raw.title || raw.title.trim() === "") {
              console.log(`[CRON] Skipping invalid/broken entry: "${raw.title || 'Untitled'}" (${raw.link || 'No URL'})`);
              skippedInvalidCount++;
              continue;
            }

            // 2. Deduplication Check using originalId AND sourceUrl
            const exists = await checkArticleExistsByOriginalId(raw.originalId, raw.link);
            if (exists) {
              console.log(`[CRON] Duplicate detected. Skipping: "${raw.title}"`);
              skippedDuplicatesCount++;
              continue;
            }
            
            processedCount++;

            // Rate limit Gemini API requests (e.g., 1.5 seconds between calls)
            await sleep(1500);
        
            // 3. AI Relevance & Summarization Check with Fallback
            let aiResult = null;
            if (isGeminiAvailable) {
              try {
                aiResult = await processArticleWithAI(raw.title, raw.contentSnippet, raw.sourceName);
                if (!aiResult) {
                  console.warn(`[CRON] AI processing returned null for "${raw.title}". Falling back to keywords.`);
                  aiFailuresCount++;
                  isGeminiAvailable = false; // Disable for rest of this run to avoid consecutive hangs/failures
                }
              } catch (aiErr) {
                console.error(`[CRON] AI processing threw an error for "${raw.title}":`, aiErr);
                aiFailuresCount++;
                isGeminiAvailable = false; // Disable for rest of this run
              }
            }

            // Fallback to keyword-based categorization if AI failed or is disabled
            if (!aiResult) {
              aiResult = fallbackProcessArticle(raw.title, raw.contentSnippet);
            }
            
            // 4. Filtering: Is it relevant and safe?
            if (aiResult.isRelevant && aiResult.isSafe) {
              // Generate a slug
              const slug = `${raw.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`.substring(0, 100);
              
              // Trust score calculation
              const trustScore = await getSourceTrustScore(raw.sourceName, raw.link);

              // Decode Google News URL to get direct link & fetch OG image
              let targetUrl = raw.link;
              let scrapedImageUrl = "";
              
              if (raw.link.includes("news.google.com")) {
                console.log(`[CRON] Decoding Google News URL: ${raw.link}`);
                const decoded = await decodeGoogleNewsUrl(raw.link);
                if (decoded && decoded !== raw.link) {
                  targetUrl = decoded;
                  console.log(`[CRON] Decoded to: ${targetUrl}`);
                }
              }
              
              if (targetUrl) {
                console.log(`[CRON] Scraping OG image from: ${targetUrl}`);
                scrapedImageUrl = await fetchOpenGraphImage(targetUrl);
                if (scrapedImageUrl) {
                  console.log(`[CRON] Successfully extracted image: ${scrapedImageUrl}`);
                } else {
                  console.log(`[CRON] No image found on target webpage.`);
                }
              }

              const articleData: Partial<Article> = {
                title: raw.title,
                titleTelugu: "", 
                slug,
                excerpt: aiResult.summary,
                excerptTelugu: aiResult.summaryTelugu,
                content: `<p>${aiResult.summary}</p>\n\n<p><strong><a href="${targetUrl}" target="_blank" rel="noopener noreferrer">Read the full story on ${raw.sourceName}</a></strong></p>`,
                category: aiResult.category, 
                author: { name: raw.sourceName },
                imageUrl: getSafeImageUrl(scrapedImageUrl || raw.thumbnailUrl),
                tags: aiResult.tags,
                isFeatured: false,
                isBreaking: aiResult.importanceScore >= 8,
                viewCount: 0,
                readingTime: 2, 
                
                // Aggregation specifics
                isAggregated: true,
                sourceUrl: targetUrl,
                sourceName: raw.sourceName,
                originalId: raw.originalId,
                approvalStatus: "auto-published",
                isPublished: true, 
                importanceScore: aiResult.importanceScore,
                trustScore,
              };
              
              await saveAggregatedArticle(articleData);
              savedCount++;
              console.log(`[CRON] Successfully saved and auto-published article: "${raw.title}" [Category: ${aiResult.category}]`);
            } else {
              console.log(`[CRON] Article "${raw.title}" filtered out. Relevant: ${aiResult.isRelevant}, Safe: ${aiResult.isSafe}`);
            }
          } catch (err) {
            console.error(`[CRON] Error processing article "${raw.title}":`, err);
          }
        }
      } catch (sourceErr) {
        console.error(`[CRON] Failed to aggregate source ${source.name} from ${source.url}:`, sourceErr);
      }
    }
    
    // Detailed summary logs as requested
    console.log("=== NEWS AGGREGATION CRON SUMMARY ===");
    console.log(`- RSS Articles Fetched: ${rssFetchCount}`);
    console.log(`- Articles Processed: ${processedCount}`);
    console.log(`- Duplicates Skipped: ${skippedDuplicatesCount}`);
    console.log(`- Invalid Entries Skipped: ${skippedInvalidCount}`);
    console.log(`- AI Processing Failures: ${aiFailuresCount}`);
    console.log(`- Articles Successfully Saved: ${savedCount}`);
    console.log("======================================");

    return NextResponse.json({
      success: true,
      summary: {
        rssFetchedCount: rssFetchCount,
        processed: processedCount,
        duplicatesSkipped: skippedDuplicatesCount,
        invalidSkipped: skippedInvalidCount,
        aiFailures: aiFailuresCount,
        saved: savedCount
      },
      message: "Aggregation complete",
    });

  } catch (error) {
    console.error("[CRON] Ingestion pipeline crashed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
