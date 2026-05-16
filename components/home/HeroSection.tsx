"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Article } from "@/lib/types";

interface HeroSectionProps {
  featured: Article;
  secondary: Article[];
}

export default function HeroSection({ featured, secondary }: HeroSectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Main Featured Article */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2"
        >
          <Link href={`/news/${featured.slug}`} className="group block relative rounded-2xl overflow-hidden">
            <div className="relative w-full h-[300px] md:h-[450px] lg:h-[500px]">
              <Image
                src={featured.imageUrl}
                alt={featured.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
              <Badge variant="gold" className="mb-3">
                {featured.categoryTelugu || featured.category}
              </Badge>
              <h2 className="text-xl md:text-3xl lg:text-4xl font-bold leading-tight mb-2 text-white font-[family-name:var(--font-playfair)] group-hover:text-gold-light transition-colors">
                {featured.title}
              </h2>
              {featured.titleTelugu && (
                <p className="text-sm md:text-base text-gold-light/70 mb-3 font-medium">
                  {featured.titleTelugu}
                </p>
              )}
              <p className="text-sm text-[#CCCCCC] line-clamp-2 max-w-2xl mb-4 hidden md:block">
                {featured.excerpt}
              </p>
              <div className="flex items-center gap-4 text-xs text-[#999]">
                <span className="font-medium text-gold/80">{featured.author.name}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {featured.readingTime} min read
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {(featured.viewCount / 1000).toFixed(1)}K
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15 * (i + 1) }}
            >
              <Link
                href={`/news/${article.slug}`}
                className="group block relative rounded-xl overflow-hidden"
              >
                <div className="relative w-full h-[140px] lg:h-[155px]">
                  <Image
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <Badge className="mb-1.5 text-[10px]">
                    {article.categoryTelugu || article.category}
                  </Badge>
                  <h3 className="text-sm font-semibold leading-snug text-white line-clamp-2 group-hover:text-gold-light transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-[11px] text-[#999] mt-1">
                    {formatDate(article.createdAt)}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
