"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import NewsCard from "@/components/news/NewsCard";
import type { Article } from "@/lib/types";

interface LatestNewsProps {
  articles: Article[];
}

export default function LatestNews({ articles }: LatestNewsProps) {
  if (!articles || articles.length === 0) return null;

  return (
    <section className="py-10 sm:py-14 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex items-baseline justify-between mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-[family-name:var(--font-playfair)] text-white">
              More Stories
            </h2>
            <p className="text-xs sm:text-sm text-gold/50 mt-1">మరిన్ని కథనాలు</p>
          </div>
          <Link
            href="/news"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-gold/80 hover:text-gold font-medium transition-colors group"
          >
            View All
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {articles.map((article, i) => (
            <NewsCard key={article.id} article={article} index={i} />
          ))}
        </div>

        {/* Mobile View All */}
        <div className="flex justify-center mt-8 sm:hidden">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-gold/30 text-gold text-sm font-semibold hover:bg-gold/10 transition-all group"
          >
            View All News
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
