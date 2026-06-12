"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate, getCategoryPlaceholder } from "@/lib/utils";
import type { Article } from "@/lib/types";

interface HeroSectionProps {
  featured: Article;
  secondary: Article[];
}

function HeroImage({ src, alt, category, priority }: { src: string; alt: string; category?: string; priority?: boolean }) {
  const fallback = getCategoryPlaceholder(category);
  const [imgSrc, setImgSrc] = useState(src || fallback);
  return (
    <img
      src={imgSrc}
      alt={alt}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      loading={priority ? "eager" : "lazy"}
      onError={() => setImgSrc(fallback)}
    />
  );
}

export default function HeroSection({ featured, secondary }: HeroSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
      {/* Main Featured Article */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="lg:col-span-2"
      >
        <Link href={`/news/${featured.slug}`} className="group block relative rounded-xl overflow-hidden bg-[#111]">
          <div className="relative w-full h-[260px] sm:h-[320px] md:h-[380px] lg:h-[420px]">
            <HeroImage src={featured.imageUrl} alt={featured.title} category={featured.category} priority />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          </div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
            <Badge variant="gold" className="mb-2.5">
              {featured.category || "News"}
            </Badge>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight mb-2 text-white font-[family-name:var(--font-playfair)] group-hover:text-gold-light transition-colors duration-200">
              {featured.title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 max-w-2xl mb-3 hidden sm:block">
              {featured.excerpt}
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              {featured.isAggregated ? (
                <span className="inline-flex items-center gap-1 font-semibold text-gold/80">
                  <ExternalLink className="w-3 h-3" />
                  {featured.sourceName || featured.author?.name}
                </span>
              ) : (
                <span className="font-medium text-gold/80">{featured.author?.name}</span>
              )}
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" /> {featured.readingTime || 2} min read
              </span>
              <span className="hidden sm:inline">{formatDate(featured.createdAt)}</span>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Secondary Stories */}
      <div className="space-y-4">
        {secondary.map((article, i) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.12 * (i + 1) }}
          >
            <Link
              href={`/news/${article.slug}`}
              className="group block relative rounded-xl overflow-hidden bg-[#111]"
            >
              <div className="relative w-full h-[130px] sm:h-[140px] lg:h-[200px]">
                <HeroImage src={article.imageUrl} alt={article.title} category={article.category} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-4">
                <Badge className="mb-1.5 text-[10px]">
                  {article.category || "News"}
                </Badge>
                <h3 className="text-sm font-semibold leading-snug text-white line-clamp-2 group-hover:text-gold-light transition-colors duration-200">
                  {article.title}
                </h3>
                <p className="text-[11px] text-gray-400 mt-1">
                  {formatDate(article.createdAt)}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
