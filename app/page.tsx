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
          getArticles(50),
          getCategories(),
        ]);

        setMagazines(mags);

        if (arts.length > 0) {
          setArticles(arts);
          setCategories(cats.length > 0 ? cats : MOCK_CATEGORIES);
          setUsingMock(false);
        } else {
          // Fall back to mock only when Firestore has absolutely zero articles
          console.log("[HOMEPAGE] Firestore returned empty article list. Falling back to mock data.");
          setArticles(MOCK_ARTICLES);
          setCategories(cats.length > 0 ? cats : MOCK_CATEGORIES);
          setUsingMock(true);
        }
      } catch (err: any) {
        console.error("[HOMEPAGE] Error loading data from Firestore:", err);
        setArticles(MOCK_ARTICLES);
        setCategories(MOCK_CATEGORIES);
        setUsingMock(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Background news aggregation trigger (rate-limited to once every 15 minutes per session)
    try {
      const lastTrigger = sessionStorage.getItem("last-news-aggregation");
      const now = Date.now();
      if (!lastTrigger || now - parseInt(lastTrigger, 10) > 15 * 60 * 1000) {
        sessionStorage.setItem("last-news-aggregation", now.toString());
        fetch("/api/cron/aggregate")
          .then(res => res.json())
          .then(data => {
            console.log("[Background Aggregation] News updated successfully:", data);
          })
          .catch(e => console.warn("[Background Aggregation] Silently failed:", e));
      }
    } catch (e) {
      // Ignore sessionStorage errors in private modes
    }
  }, []);

  const latestMagazine = magazines[0];
  const archiveMagazines = magazines.slice(1);
  
  // Breaking news
  const breakingNewsArticles = articles.filter(a => a.isBreaking);

  // Featured layout: top article + 2 secondary
  const featuredArticle = articles[0];
  const secondaryArticles = articles.slice(1, 3);
  
  // Latest news grid: next 6 articles after the featured block
  const latestNewsArticles = articles.slice(3, 9);

  return (
    <>
      <Navbar />
      <div className="h-[72px]" />

      <main className="flex-1">
        {loading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
            <HeroSkeleton />
          </div>
        ) : (
          <>
            {/* 1. Latest Magazine Hero */}
            {latestMagazine && (
              <MagazineHero magazine={latestMagazine} />
            )}

            {/* 2. Magazine Archive Carousel */}
            {archiveMagazines.length > 0 && (
              <MagazineCarousel magazines={archiveMagazines} />
            )}

            {/* 3. Breaking News Ticker */}
            {breakingNewsArticles.length > 0 && (
              <BreakingNewsTicker articles={breakingNewsArticles} />
            )}

            {/* 4. Featured + Latest News */}
            {featuredArticle && (
              <section className="py-10 sm:py-14 bg-[#0A0A0A]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-baseline justify-between mb-6 sm:mb-8">
                    <div>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-[family-name:var(--font-playfair)] text-white">
                        Latest News
                      </h2>
                      <p className="text-xs sm:text-sm text-gold/50 mt-1">తాజా వార్తలు</p>
                    </div>
                  </div>
                  <HeroSection featured={featuredArticle} secondary={secondaryArticles} />
                </div>
              </section>
            )}

            {/* 5. Latest News Grid */}
            {latestNewsArticles.length > 0 && (
              <LatestNews articles={latestNewsArticles} />
            )}

            <AdBanner category="homepage_banner" />

            {/* 6. Category News */}
            {articles.length > 0 && (
              <CategoryNews articles={articles} categories={categories} />
            )}

            {usingMock && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                <div className="rounded-xl bg-gold/5 border border-gold/20 p-4 text-center">
                  <p className="text-sm text-gold/80">
                    📋 Showing demo news content. Live articles will appear after the next aggregation run.
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
