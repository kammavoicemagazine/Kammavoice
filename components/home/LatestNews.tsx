"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import NewsCard from "@/components/news/NewsCard";
import type { Article } from "@/lib/types";

interface LatestNewsProps {
  articles: Article[];
}

export default function LatestNews({ articles }: LatestNewsProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Section Heading */}
      <div className="section-heading">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-playfair)]">
            Latest News
          </h2>
          <p className="text-sm text-gold/60 mt-0.5">తాజా వార్తలు</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, i) => (
          <NewsCard key={article.id} article={article} index={i} />
        ))}
      </div>

      {/* View All */}
      <div className="flex justify-center mt-10">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-gold/30 text-gold text-sm font-semibold hover:bg-gold/10 transition-all group"
        >
          View All News | అన్ని వార్తలు
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
}
