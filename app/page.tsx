"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MagazineHero from "@/components/home/MagazineHero";
import MagazineCarousel from "@/components/home/MagazineCarousel";
import HeroSection from "@/components/home/HeroSection";
import BreakingNewsTicker from "@/components/home/BreakingNewsTicker";
import LatestNews from "@/components/home/LatestNews";
import CategoryNews from "@/components/home/CategoryNews";
import AdBanner from "@/components/ads/AdBanner";
import { HeroSkeleton } from "@/components/ui/skeleton";
import { getArticles, getCategories, getMagazines } from "@/lib/firestore";
import { MOCK_ARTICLES, CATEGORIES as MOCK_CATEGORIES } from "@/lib/mock-data";
import type { Article, Category, Magazine } from "@/lib/types";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export default function HomePage() {
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [mags, arts, cats] = await Promise.all([
          getMagazines(10),
          getArticles(20),
          getCategories(),
        ]);

        setMagazines(mags);

        if (arts.length > 0) {
          setArticles(arts);
          setCategories(cats.length > 0 ? cats : MOCK_CATEGORIES);
        } else {
          setArticles(MOCK_ARTICLES);
          setCategories(MOCK_CATEGORIES);
          setUsingMock(true);
        }
      } catch {
        setArticles(MOCK_ARTICLES);
        setCategories(MOCK_CATEGORIES);
        setUsingMock(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const latestMagazine = magazines[0];
  const archiveMagazines = magazines.slice(1);
  
  // Featured stories from latest issue (or fallback to general featured)
  const magazineStories = latestMagazine 
    ? articles.filter(a => a.magazineId === latestMagazine.id).slice(0, 3) 
    : [];
  const topStories = magazineStories.length > 0 ? magazineStories : articles.slice(0, 3);
  
  const featuredArticle = topStories[0];
  const secondaryArticles = topStories.slice(1, 3);
  const latestNews = articles.filter(a => !topStories.includes(a)).slice(0, 6);

  return (
    <>
      <Navbar />
      <div className="h-[72px]" />

      <BreakingNewsTicker />

      <main className="flex-1">
        {loading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
            <HeroSkeleton />
          </div>
        ) : (
          <>
            {/* 1. Magazine Hero (Top Priority) */}
            {latestMagazine && (
              <MagazineHero magazine={latestMagazine} />
            )}

            {/* 2. Featured Stories extracted from Latest Issue */}
            {(featuredArticle || secondaryArticles.length > 0) && (
              <div className="py-16 bg-surface border-b border-border-subtle">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-playfair)]">
                      {magazineStories.length > 0 ? "Featured in this Issue" : "Top Stories"}
                    </h2>
                    <Link href="/news" className="text-sm font-medium text-gold hover:text-gold-light flex items-center gap-1 group">
                      View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Featured */}
                    {featuredArticle && (
                      <div className="lg:col-span-8 group">
                        <Link href={`/news/${featuredArticle.slug}`} className="block relative aspect-[16/9] w-full rounded-2xl overflow-hidden mb-6">
                          <Image
                            src={featuredArticle.imageUrl}
                            alt={featuredArticle.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                            <span className="inline-block px-3 py-1 bg-gold text-[#0A0A0A] text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                              {featuredArticle.category}
                            </span>
                            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-[family-name:var(--font-playfair)] leading-tight mb-3 group-hover:text-gold transition-colors line-clamp-2">
                              {featuredArticle.title}
                            </h3>
                            <p className="text-gray-300 text-sm sm:text-base line-clamp-2 max-w-3xl">
                              {featuredArticle.excerpt}
                            </p>
                          </div>
                        </Link>
                      </div>
                    )}
                    
                    {/* Secondary Featured */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                      {secondaryArticles.map((article) => (
                        <Link key={article.id} href={`/news/${article.slug}`} className="group flex gap-4 bg-surface-hover p-3 rounded-xl border border-transparent hover:border-border-subtle transition-colors">
                          <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={article.imageUrl}
                              alt={article.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          </div>
                          <div className="flex flex-col justify-center py-1">
                            <span className="text-[10px] sm:text-xs font-bold text-gold uppercase tracking-wider mb-2">
                              {article.category}
                            </span>
                            <h4 className="text-sm sm:text-base font-bold font-[family-name:var(--font-playfair)] leading-snug group-hover:text-gold transition-colors line-clamp-3">
                              {article.title}
                            </h4>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Magazine Carousel */}
            {archiveMagazines.length > 0 && (
              <MagazineCarousel magazines={archiveMagazines} />
            )}

            {/* 4. News Section (Demoted) */}
            <div className="py-12 bg-surface">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="section-heading mb-8">
                  <h2 className="text-2xl font-bold font-[family-name:var(--font-playfair)] text-gold">Latest News</h2>
                </div>
                {featuredArticle && (
                  <HeroSection featured={featuredArticle} secondary={secondaryArticles} />
                )}
              </div>
            </div>

            <LatestNews articles={latestNews} />

            <AdBanner variant="leaderboard" />

            <CategoryNews articles={articles} categories={categories} />

            {usingMock && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                <div className="rounded-xl bg-gold/5 border border-gold/20 p-4 text-center">
                  <p className="text-sm text-gold/80">
                    📋 Showing demo news content. Upload a Magazine in the admin dashboard to see the real layout.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
