import { NextResponse } from "next/server";
import { adminGetArticles as getArticles } from "@/lib/firestore-admin-operations";
import Parser from "rss-parser"; // Just importing to satisfy compiler, but we manually generate XML

export async function GET() {
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kammavoice.com";
  
  try {
    // Fetch top 50 published articles (this includes both editorial & aggregated since getArticles filters by isPublished==true)
    const articles = await getArticles(50);
    
    let feedXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Kamma Voice</title>
    <link>${BASE_URL}</link>
    <description>The premier digital platform and magazine for the Kamma community.</description>
    <language>en-in</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
`;

    articles.forEach((article) => {
      const isAggregated = article.isAggregated === true;
      const title = isAggregated ? `${article.title} (Via ${article.sourceName || 'Web'})` : article.title;
      const link = `${BASE_URL}/news/${article.slug}`;
      const description = article.excerpt || "";
      const pubDate = new Date(article.createdAt).toUTCString();
      const author = isAggregated ? (article.sourceName || "Kamma Voice Aggregator") : article.author.name;

      feedXml += `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator><![CDATA[${author}]]></dc:creator>
      <description><![CDATA[${description}]]></description>
      ${article.imageUrl ? `<media:content url="${article.imageUrl}" medium="image" />` : ''}
    </item>`;
    });

    feedXml += `
  </channel>
</rss>`;

    return new NextResponse(feedXml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "s-maxage=3600, stale-while-revalidate",
      },
    });
  } catch (error) {
    console.error("Error generating RSS feed:", error);
    return new NextResponse("Error generating feed", { status: 500 });
  }
}
