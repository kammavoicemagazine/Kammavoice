"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NewsCard from "@/components/news/NewsCard";
import type { Article, Category } from "@/lib/types";

interface CategoryNewsProps {
  articles: Article[];
  categories: Category[];
}

export default function CategoryNews({ articles, categories }: CategoryNewsProps) {
  const [active, setActive] = useState("all");

  const filtered =
    active === "all"
      ? articles
      : articles.filter((a) => {
          if (!a.category) return false;
          const cat = categories.find((c) => c.id === active);
          const slug = cat ? (cat.slug || cat.name.toLowerCase()) : active;
          return a.category.toLowerCase() === slug.toLowerCase();
        });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Section Heading */}
      <div className="section-heading">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-playfair)]">
            Explore by Category
          </h2>
          <p className="text-sm text-gold/60 mt-0.5">విభాగం వారీగా అన్వేషించండి</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActive("all")}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
            active === "all"
              ? "bg-gold text-[#0A0A0A]"
              : "bg-surface border border-border-subtle text-muted hover:text-foreground hover:border-gold/30"
          }`}
        >
          All | అన్నీ
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActive(cat.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
              active === cat.id
                ? "bg-gold text-[#0A0A0A]"
                : "bg-surface border border-border-subtle text-muted hover:text-foreground hover:border-gold/30"
            }`}
          >
            {cat.name} | {cat.nameTelugu}
          </button>
        ))}
      </div>

      {/* Filtered Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filtered.slice(0, 6).map((article, i) => (
            <NewsCard key={article.id} article={article} index={i} />
          ))}
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted">
          <p className="text-lg">No articles in this category yet.</p>
          <p className="text-sm mt-1">ఈ విభాగంలో ఇంకా వ్యాసాలు లేవు.</p>
        </div>
      )}
    </section>
  );
}
