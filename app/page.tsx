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
import { HeroSkeleton } from "@/components/ui/skeleton";
import { getArticles, getCategories, getMagazines, getAllActiveAds } from "@/lib/firestore";
import { MOCK_ARTICLES, CATEGORIES as MOCK_CATEGORIES } from "@/lib/mock-data";
import type { Article, Category, Magazine, Advertisement } from "@/lib/types";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function HomePage() {
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [mags, arts, cats, adsData] = await Promise.all([
          getMagazines(10),
          getArticles(50),
          getCategories(),
          getAllActiveAds(),
        ]);

        setMagazines(mags);
        setAds(adsData);

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

            {/* Premium Sponsors & Partners Section */}
            <section className="py-12 bg-gradient-to-b from-[#0B0B0B] to-[#121212] border-t border-b border-border-subtle/30">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                  <div>
                    <span className="text-xs font-bold text-gold uppercase tracking-widest font-mono flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse text-gold" /> Sponsors &amp; Partners
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-playfair)] text-foreground mt-1">
                      Featured Sponsors &amp; Partners
                    </h2>
                    <p className="text-xs text-muted/60 mt-0.5 font-medium tracking-wide">
                      మా విశిష్ట స్పాన్సర్లు &amp; భాగస్వాములు
                    </p>
                  </div>
                  <Link
                    href="/advertisements"
                    className="text-xs font-bold text-gold hover:text-gold-light hover:underline transition-colors shrink-0"
                  >
                    View Sponsor Directory →
                  </Link>
                </div>

                {/* Ads Grid */}
                {ads.length === 0 ? (
                  <div className="text-center py-12 bg-[#141414] rounded-2xl border border-border-subtle/40">
                    <p className="text-sm text-muted">No active sponsors featured this week.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
                    {ads.map((ad) => {
                      const isCover = ["front_cover", "front_inner_cover", "back_inner_cover", "back_cover"].includes(ad.category);
                      return (
                        <Link
                          key={ad.id}
                          href={`/advertisements/${ad.slug || ad.id}`}
                          className={`group block relative rounded-xl overflow-hidden bg-[#141414] border transition-all duration-300 hover:-translate-y-1 shadow-md ${
                            isCover ? "border-gold/50 hover:border-gold hover:shadow-gold/10" : "border-border-subtle hover:border-gold/30 hover:shadow-black/60"
                          }`}
                        >
                          <div className="relative aspect-[16/11] bg-black/10 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={ad.imageUrl}
                              alt={ad.sponsorName || ad.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {isCover && (
                              <span className="absolute top-2 left-2 bg-gradient-to-r from-gold to-yellow-500 text-black text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider shadow">
                                Cover Sponsor
                              </span>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="text-sm font-bold font-[family-name:var(--font-playfair)] text-foreground group-hover:text-gold transition-colors line-clamp-1">
                              {ad.sponsorName || ad.title}
                            </h3>
                            <p className="text-[10px] text-muted uppercase mt-0.5 font-mono tracking-wider">
                              {ad.category.replace("_", " ")}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* 📢 Advertise With Kamma Voice CTA banner */}
                <div className="bg-gradient-to-r from-[#141414] via-[#2A2312] to-[#141414] border border-gold/30 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />
                  <div className="relative z-10 text-center md:text-left">
                    <h3 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-playfair)] text-gold-gradient">
                      Advertise With Kamma Voice Magazine
                    </h3>
                    <p className="text-sm text-muted mt-1.5 max-w-xl leading-relaxed">
                      Connect your business to thousands of active Telugu readers worldwide. Get premium cover listings and full-page advertisements today.
                    </p>
                  </div>
                  <a
                    href="https://wa.me/918247330933?text=Hello%20Kamma%20Voice%2C%20I%20am%20interested%20in%20sponsoring/advertising%20in%20your%20magazine."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold via-yellow-500 to-gold text-[#0A0A0A] font-bold text-sm rounded-xl hover:from-gold hover:to-gold-light transition-all shadow-lg shadow-gold/20 shrink-0 cursor-pointer relative z-10 uppercase tracking-wider"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.859 0c3.161.001 6.136 1.233 8.375 3.474 2.238 2.24 3.467 5.216 3.466 8.378-.004 6.528-5.33 11.852-11.86 11.852-2.003-.001-3.97-.509-5.719-1.48L0 24zm6.59-4.846c1.6.95 3.111 1.466 4.93 1.467 5.487 0 9.953-4.462 9.957-9.948a9.882 9.882 0 0 0-2.895-7.038A9.9 9.9 0 0 0 11.862 2.06c-5.49 0-9.957 4.463-9.96 9.95-.001 1.94.512 3.83 1.486 5.486L2.33 21.755l4.318-1.601zM17.472 14.382c-.3-.149-1.777-.878-2.052-.978-.276-.099-.476-.149-.676.15-.201.3-.778.977-.954 1.176-.176.201-.351.226-.651.075-.3-.15-1.27-.469-2.42-1.494-.894-.797-1.498-1.782-1.673-2.081-.176-.3-.018-.462.13-.61.137-.133.3-.351.45-.525.15-.174.2-.299.3-.499.1-.2.05-.375-.025-.524-.075-.15-.676-1.63-1.026-2.47-.324-.777-.655-.668-.901-.681-.23-.011-.493-.013-.756-.013-.262 0-.689.099-.976.413-.287.313-1.097 1.074-1.097 2.62 0 1.54 1.125 3.03 1.275 3.23.15.201 2.212 3.377 5.358 4.733.748.323 1.333.517 1.789.663.753.24 1.437.206 1.98.125.603-.09 1.777-.727 2.027-1.43.25-.702.25-1.303.176-1.43-.075-.124-.275-.201-.575-.351z"/>
                    </svg>
                    Enquire on WhatsApp
                  </a>
                </div>

              </div>
            </section>

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
