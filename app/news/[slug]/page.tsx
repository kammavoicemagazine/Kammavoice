"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, User, Calendar, Share2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getArticleBySlug, incrementViewCount, getArticles } from "@/lib/firestore";
import { formatDate, formatDateTelugu, getCategoryPlaceholder } from "@/lib/utils";
import type { Article } from "@/lib/types";
import NewsCard from "@/components/news/NewsCard";
import { shareContent } from "@/lib/capacitor-init";

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    setError(false);

    getArticleBySlug(slug)
      .then(async (data) => {
        if (data) {
          setArticle(data);
          // Track view
          incrementViewCount(data.id).catch(() => {});
          // Load related articles
          try {
            const all = await getArticles(20);
            setRelated(
              all
                .filter((a) => a.id !== data.id && a.category === data.category)
                .slice(0, 3)
            );
          } catch {
            // Ignore related articles errors
          }
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="h-[72px]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-5 w-1/2 mb-6" />
          <Skeleton className="w-full h-[300px] md:h-[450px] rounded-2xl mb-8" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !article) {
    return (
      <>
        <Navbar />
        <div className="h-[72px]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-3xl font-bold mb-3 font-[family-name:var(--font-playfair)]">
            Article Not Found
          </h1>
          <p className="text-muted mb-6">
            The article you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold text-[#0A0A0A] font-semibold text-sm hover:bg-gold-light transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const handleShare = async () => {
    await shareContent(article.title, article.excerpt, window.location.href);
  };

  return (
    <>
      <Navbar />
      <div className="h-[72px]" />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {article && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                headline: article.title,
                image: [article.imageUrl],
                datePublished: article.createdAt,
                dateModified: article.updatedAt || article.createdAt,
                author: [{
                  "@type": "Person",
                  "name": article.isAggregated ? (article.sourceName || "Kamma Voice Aggregator") : article.author.name,
                }],
              }),
            }}
          />
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted mb-6">
            <Link href="/" className="hover:text-gold transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/news" className="hover:text-gold transition-colors">
              News
            </Link>
            <span>/</span>
            <span className="text-gold">{article.category}</span>
          </div>

          {/* Category + Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge variant="gold">{article.categoryTelugu || article.category}</Badge>
            {article.isBreaking && <Badge variant="danger">Breaking</Badge>}
            {article.isFeatured && <Badge variant="outline">Featured</Badge>}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-3 font-[family-name:var(--font-playfair)]">
            {article.title}
          </h1>
          {article.titleTelugu && (
            <p className="text-lg md:text-xl text-gold/60 mb-4 font-medium">
              {article.titleTelugu}
            </p>
          )}

          {/* Excerpt */}
          <p className="text-lg text-muted leading-relaxed mb-6">
            {article.excerpt}
          </p>

          {/* Author + Meta Row */}
          <div className="flex flex-wrap items-center gap-4 pb-6 mb-8 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center">
                <User className="w-4 h-4 text-gold" />
              </div>
              <div>
                {article.isAggregated ? (
                  <p className="text-sm font-bold uppercase tracking-wider text-gold">Source: {article.sourceName || article.author.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium">{article.author.name}</p>
                    {article.author.role && (
                      <p className="text-[11px] text-muted">{article.author.role}</p>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(article.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {article.readingTime} min read
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {article.viewCount.toLocaleString()} views
              </span>
            </div>
            <button
              onClick={handleShare}
              className="ml-auto p-2 rounded-lg text-muted hover:text-gold hover:bg-gold/5 transition-all cursor-pointer"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Cover Image */}
          <div className="relative w-full h-[300px] md:h-[450px] rounded-2xl overflow-hidden mb-10 bg-[#111]">
            <img
              src={article.imageUrl || getCategoryPlaceholder(article.category)}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = getCategoryPlaceholder(article.category); }}
            />
          </div>

          {/* Content */}
          <div
            className="prose prose-invert prose-lg max-w-none mb-12
              prose-headings:font-[family-name:var(--font-playfair)]
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-[#CCCCCC] prose-p:leading-relaxed
              prose-a:text-gold prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground
              prose-blockquote:border-l-gold prose-blockquote:text-muted
              prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Original Source Link */}
          {article.isAggregated && article.sourceUrl && (
            <div className="p-5 mb-12 bg-surface border border-border-subtle rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Read the full original article</p>
                <p className="text-xs text-muted mt-1">This summary was automatically generated by AI.</p>
              </div>
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 text-gold hover:bg-gold hover:text-black font-semibold text-sm rounded-lg transition-colors"
              >
                Visit Source
              </a>
            </div>
          )}

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-8 mb-10 border-b border-border-subtle">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs bg-surface border border-border-subtle text-muted"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Related Articles */}
        {related.length > 0 && (
          <section>
            <div className="section-heading">
              <h2 className="text-2xl font-bold font-[family-name:var(--font-playfair)]">
                Related Articles
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((a, i) => (
                <NewsCard key={a.id} article={a} index={i} />
              ))}
            </div>
          </section>
        )}
      </article>

      <Footer />
    </>
  );
}
