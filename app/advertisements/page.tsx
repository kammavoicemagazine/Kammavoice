import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAllActiveAds } from "@/lib/firestore";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Sparkles, Trophy, Award, BookOpen, Layers, MessageSquare } from "lucide-react";

export const revalidate = 60; // Revalidate every minute for live testing

export const metadata: Metadata = {
  title: "Sponsors & Advertisements | Kamma Voice",
  description: "Explore our featured premium sponsors and advertisements in Kamma Voice Magazine.",
  openGraph: {
    title: "Sponsors & Advertisements | Kamma Voice",
    description: "Explore our featured premium sponsors and advertisements in Kamma Voice Magazine.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sponsors & Advertisements | Kamma Voice",
    description: "Explore our featured premium sponsors and advertisements in Kamma Voice Magazine.",
  }
};

const CATEGORY_LABELS: Record<string, string> = {
  front_cover: "Front Cover",
  front_inner_cover: "Front Inner Cover",
  back_inner_cover: "Back Inner Cover",
  back_cover: "Back Cover",
  full_page: "Full Page",
  half_page: "Half Page",
  // Fallbacks for backward compatibility
  homepage_banner: "Homepage Banner",
  magazine_banner: "Magazine Banner",
  article_banner: "Article Banner"
};

const PRIORITY_ORDER: Record<string, number> = {
  front_cover: 0,
  front_inner_cover: 1,
  back_inner_cover: 2,
  back_cover: 3,
  full_page: 4,
  half_page: 5
};

export default async function AdvertisementsPage() {
  const ads = await getAllActiveAds();

  // Filter and sort Premium Covers
  const coverCategories = ["front_cover", "front_inner_cover", "back_inner_cover", "back_cover"];
  const premiumCovers = ads
    .filter(ad => coverCategories.includes(ad.category))
    .sort((a, b) => (PRIORITY_ORDER[a.category] ?? 99) - (PRIORITY_ORDER[b.category] ?? 99));

  // Filter other sizes
  const fullPageAds = ads.filter(ad => ad.category === "full_page");
  const halfPageAds = ads.filter(ad => ad.category === "half_page");

  // Keep compatibility for any legacy banners
  const legacyBanners = ads.filter(ad => ["homepage_banner", "magazine_banner", "article_banner"].includes(ad.category));

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20 bg-gradient-to-b from-[#0A0A0A] to-[#121212] text-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header section with Sponsor Directory Look */}
          <div className="text-center mb-10 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
            <h1 className="text-4xl sm:text-5xl font-bold font-[family-name:var(--font-playfair)] text-gold-gradient mb-3 flex items-center justify-center gap-2.5">
              <Sparkles className="w-8 h-8 text-gold animate-pulse" />
              Sponsor Directory
            </h1>
            <p className="text-muted max-w-xl mx-auto text-xs sm:text-sm">
              Discover and support the key partners, community leaders, and businesses featured inside Kamma Voice Magazine.
            </p>
          </div>

          {/* 📢 Advertise With Kamma Voice Banner */}
          <div className="bg-gradient-to-r from-[#141414] via-[#2A2312] to-[#141414] border border-gold/30 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl mb-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />
            <div className="relative z-10 text-center md:text-left">
              <span className="text-[10px] font-bold text-gold uppercase tracking-widest font-mono">Advertise With Us</span>
              <h2 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-playfair)] text-foreground mt-1">
                Sponsor Kamma Voice Magazine
              </h2>
              <p className="text-xs sm:text-sm text-muted mt-1.5 max-w-2xl leading-relaxed">
                Connect your business to thousands of active Telugu readers worldwide. Get premium cover listings and full-page advertisements today.
              </p>
            </div>
            <a
              href="https://wa.me/918247330933?text=Hello%20Kamma%20Voice%2C%20I%20am%20interested%20in%20sponsoring/advertising%20in%20your%20magazine."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-gold via-yellow-500 to-gold text-[#0A0A0A] font-bold text-xs rounded-xl hover:from-gold hover:to-gold-light transition-all shadow-lg shadow-gold/20 shrink-0 cursor-pointer relative z-10 uppercase tracking-widest"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              Sponsor via WhatsApp
            </a>
          </div>

          {ads.length === 0 ? (
            <div className="text-center py-20 bg-[#141414] rounded-2xl border border-border-subtle/40 shadow-xl max-w-3xl mx-auto">
              <Award className="w-16 h-16 text-gold/30 mx-auto mb-4" />
              <p className="text-muted text-base">No active advertisements at the moment.</p>
              <p className="text-xs text-muted/65 mt-1.5">Check back later or contact admin to sponsor.</p>
            </div>
          ) : (
            <div className="space-y-16">

              {/* 1.🏆 Premium Cover Sponsors Section */}
              {premiumCovers.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-gold/20 pb-3">
                    <div className="p-2 rounded-lg bg-gold/10 text-gold border border-gold/20">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-playfair)] text-gold">
                      🏆 Premium Cover Sponsors
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    {premiumCovers.map((ad) => (
                      <Link
                        key={ad.id}
                        href={`/advertisements/${ad.slug || ad.id}`}
                        className="group block relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#1E1E1E] to-[#141414] border-2 border-gold/50 hover:border-gold transition-all duration-300 shadow-lg shadow-gold/5 hover:shadow-gold/15 hover:scale-[1.01]"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
                        
                        <div className="relative aspect-[16/10] bg-black/40 border-b border-gold/20 overflow-hidden">
                          <Image
                            src={ad.imageUrl}
                            alt={ad.sponsorName || ad.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute top-4 left-4 bg-gradient-to-r from-gold via-yellow-500 to-gold text-[#0A0A0A] text-xs font-extrabold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 border border-white/20 uppercase tracking-wider">
                            <Trophy className="w-3.5 h-3.5" />
                            Premium Sponsor - {CATEGORY_LABELS[ad.category]}
                          </div>
                        </div>

                        <div className="p-6 relative">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <span className="text-[10px] font-bold text-gold uppercase tracking-wider font-mono">
                                Magazine Placement: {CATEGORY_LABELS[ad.category]}
                              </span>
                              <h3 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-playfair)] text-foreground group-hover:text-gold transition-colors mt-0.5 line-clamp-1">
                                {ad.sponsorName || ad.title}
                              </h3>
                            </div>
                          </div>
                          
                          {ad.description && (
                            <p className="text-sm text-muted leading-relaxed line-clamp-2 mb-4">
                              {ad.description}
                            </p>
                          )}
                          
                          <div className="flex items-center text-gold text-sm font-bold mt-2 group-hover:translate-x-1.5 transition-transform">
                            View Details &amp; Contacts →
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* 2.📖 Full Page Advertisements Section */}
              {fullPageAds.length > 0 && (
                <section className="space-y-6 pt-4">
                  <div className="flex items-center gap-3 border-b border-border-subtle/50 pb-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-playfair)] text-foreground">
                      📖 Full Page Advertisements
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                    {fullPageAds.map((ad) => (
                      <Link
                        key={ad.id}
                        href={`/advertisements/${ad.slug || ad.id}`}
                        className="group block relative rounded-xl overflow-hidden bg-[#161616] border border-border-subtle hover:border-gold/30 transition-all shadow-md hover:shadow-black/60 hover:-translate-y-0.5"
                      >
                        <div className="relative aspect-video bg-black/20 overflow-hidden">
                          <Image
                            src={ad.imageUrl}
                            alt={ad.sponsorName || ad.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute top-3 left-3 bg-[#1A1A1A]/90 text-gold text-[10px] font-bold px-2.5 py-1 rounded border border-gold/20 uppercase tracking-widest">
                            Full Page
                          </div>
                        </div>
                        <div className="p-5">
                          <h3 className="text-lg font-bold font-[family-name:var(--font-playfair)] text-foreground group-hover:text-gold transition-colors line-clamp-1 mb-1.5">
                            {ad.sponsorName || ad.title}
                          </h3>
                          {ad.description && (
                            <p className="text-xs text-muted line-clamp-2 mb-4 leading-relaxed">
                              {ad.description}
                            </p>
                          )}
                          <div className="flex items-center text-gold text-xs font-semibold group-hover:translate-x-1 transition-transform">
                            View Details →
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* 3.📄 Half Page Advertisements Section */}
              {halfPageAds.length > 0 && (
                <section className="space-y-6 pt-4">
                  <div className="flex items-center gap-3 border-b border-border-subtle/50 pb-3">
                    <div className="p-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                      <Layers className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-playfair)] text-foreground">
                      📄 Half Page Advertisements
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                    {halfPageAds.map((ad) => (
                      <Link
                        key={ad.id}
                        href={`/advertisements/${ad.slug || ad.id}`}
                        className="group block relative rounded-xl overflow-hidden bg-[#161616] border border-border-subtle hover:border-gold/30 transition-all shadow-md hover:shadow-black/60 hover:-translate-y-0.5"
                      >
                        <div className="relative aspect-video bg-black/20 overflow-hidden">
                          <Image
                            src={ad.imageUrl}
                            alt={ad.sponsorName || ad.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute top-3 left-3 bg-[#1A1A1A]/90 text-gold text-[10px] font-bold px-2.5 py-1 rounded border border-gold/20 uppercase tracking-widest">
                            Half Page
                          </div>
                        </div>
                        <div className="p-5">
                          <h3 className="text-lg font-bold font-[family-name:var(--font-playfair)] text-foreground group-hover:text-gold transition-colors line-clamp-1 mb-1.5">
                            {ad.sponsorName || ad.title}
                          </h3>
                          {ad.description && (
                            <p className="text-xs text-muted line-clamp-2 mb-4 leading-relaxed">
                              {ad.description}
                            </p>
                          )}
                          <div className="flex items-center text-gold text-xs font-semibold group-hover:translate-x-1 transition-transform">
                            View Details →
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* 4. Compatible legacy/fallback banners if any */}
              {legacyBanners.length > 0 && (
                <section className="space-y-6 pt-4 border-t border-border-subtle/30">
                  <div className="flex items-center gap-3 border-b border-border-subtle/50 pb-3">
                    <h2 className="text-lg font-bold font-[family-name:var(--font-playfair)] text-muted-foreground">
                      Other Sponsors &amp; Placements
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                    {legacyBanners.map((ad) => (
                      <Link
                        key={ad.id}
                        href={`/advertisements/${ad.slug || ad.id}`}
                        className="group block relative rounded-xl overflow-hidden bg-[#161616] border border-border-subtle hover:border-gold/30 transition-all shadow-md"
                      >
                        <div className="relative aspect-video bg-black/20 overflow-hidden">
                          <Image
                            src={ad.imageUrl}
                            alt={ad.sponsorName || ad.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="text-sm font-bold text-foreground group-hover:text-gold transition-colors line-clamp-1">
                            {ad.sponsorName || ad.title}
                          </h3>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
