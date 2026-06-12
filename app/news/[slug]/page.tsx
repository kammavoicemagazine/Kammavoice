import { Metadata } from "next";
import { getArticleBySlugSSR } from "@/lib/firestore";
import NewsArticleClient from "./NewsArticleClient";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlugSSR(slug);

  if (!article) {
    return {
      title: "Article Not Found | Kamma Voice",
    };
  }

  const title = `${article.title} | Kamma Voice News`;
  const description = article.excerpt || `Read the latest news about ${article.category} on Kamma Voice.`;

  return {
    title,
    description,
    keywords: article.tags || [],
    alternates: {
      canonical: `https://www.kammavoice.com/news/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: article.createdAt,
      authors: [article.isAggregated ? (article.sourceName || "Kamma Voice") : article.author.name],
      images: [
        {
          url: article.imageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [article.imageUrl],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  // We don't fetch the article here and pass it down because NewsArticleClient 
  // is already perfectly setup to fetch client-side and handle views/related.
  // We just let the client do its job while SEO bots get the metadata above.
  return <NewsArticleClient />;
}
