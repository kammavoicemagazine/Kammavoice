"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Eye, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Article } from "@/lib/types";

interface NewsCardProps {
  article: Article;
  index?: number;
  variant?: "default" | "compact";
}

export default function NewsCard({ article, index = 0, variant = "default" }: NewsCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link
        href={`/news/${article.slug}`}
        className="card-hover group block rounded-xl overflow-hidden bg-surface border border-border-subtle hover:border-gold/20 transition-colors"
      >
        {/* Image */}
        <div className="relative overflow-hidden">
          <div className={`relative w-full ${variant === "compact" ? "h-40" : "h-48 md:h-52"}`}>
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
            />
          </div>
          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <Badge variant="gold">
              {article.categoryTelugu || article.category}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-base font-bold leading-snug line-clamp-2 text-foreground group-hover:text-gold transition-colors font-[family-name:var(--font-playfair)]">
            {article.title}
          </h3>
          {article.titleTelugu && (
            <p className="text-xs text-gold/50 mt-1 line-clamp-1">
              {article.titleTelugu}
            </p>
          )}
          <p className="text-sm text-muted mt-2 line-clamp-2 leading-relaxed">
            {article.excerpt}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border-subtle">
            <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              {article.isAggregated ? (
                <div className="flex items-center gap-1.5 text-gold hover:underline">
                  <span className="text-xs font-bold uppercase tracking-wider truncate">
                    Source: {article.sourceName || article.author.name}
                  </span>
                </div>
              ) : (
                <p className="text-xs font-medium text-foreground truncate">
                  {article.author.name}
                </p>
              )}
              <p className="text-[11px] text-muted">{formatDate(article.createdAt)}</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted shrink-0">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {article.readingTime}m
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {(article.viewCount / 1000).toFixed(1)}K
              </span>
            </div>
          </div>
        </div>

        {/* Gold accent line at bottom */}
        <div className="h-0.5 w-0 bg-gradient-to-r from-gold to-gold-light group-hover:w-full transition-all duration-500" />
      </Link>
    </motion.article>
  );
}
