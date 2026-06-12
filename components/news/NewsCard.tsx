"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, ExternalLink, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate, getCategoryPlaceholder } from "@/lib/utils";
import type { Article } from "@/lib/types";

interface NewsCardProps {
  article: Article;
  index?: number;
  variant?: "default" | "compact";
}

export default function NewsCard({ article, index = 0, variant = "default" }: NewsCardProps) {
  const fallback = getCategoryPlaceholder(article.category);
  const [imgSrc, setImgSrc] = useState(article.imageUrl || fallback);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Link
        href={`/news/${article.slug}`}
        className="group block rounded-xl overflow-hidden bg-[#111] border border-white/[0.06] hover:border-gold/20 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
      >
        {/* Image */}
        <div className="relative overflow-hidden">
          <div className={`relative w-full ${variant === "compact" ? "h-36" : "h-44 sm:h-48"}`}>
            <img
              src={imgSrc}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={() => setImgSrc(fallback)}
            />
            {/* Subtle gradient overlay on image */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <Badge variant="gold">
              {article.category || "News"}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <h3 className="text-sm sm:text-base font-bold leading-snug line-clamp-2 text-white group-hover:text-gold transition-colors duration-200 font-[family-name:var(--font-playfair)]">
            {article.title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 mt-2 line-clamp-2 leading-relaxed">
            {article.excerpt}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-white/[0.06] text-[11px] text-gray-500">
            {article.isAggregated ? (
              <span className="inline-flex items-center gap-1 text-gold/80 font-semibold truncate">
                <ExternalLink className="w-3 h-3 shrink-0" />
                {article.sourceName || article.author?.name || "Source"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-gray-300 font-medium truncate">
                <User className="w-3 h-3 shrink-0" />
                {article.author?.name || "Kamma Voice"}
              </span>
            )}
            <span className="text-white/10">•</span>
            <span className="inline-flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3" />
              {article.readingTime || 2}m
            </span>
            <span className="text-white/10">•</span>
            <span className="shrink-0">{formatDate(article.createdAt)}</span>
          </div>
        </div>

        {/* Gold accent line */}
        <div className="h-[2px] w-0 bg-gradient-to-r from-gold to-gold-light group-hover:w-full transition-all duration-500" />
      </Link>
    </motion.article>
  );
}
