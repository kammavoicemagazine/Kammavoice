"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { getActiveAdsByCategory, incrementAdImpression, incrementAdClick } from "@/lib/firestore";
import type { Advertisement, AdCategory } from "@/lib/types";

interface AdBannerProps {
  category?: AdCategory;
  className?: string;
  // Legacy support for older usages
  variant?: "leaderboard" | "sidebar" | "inline";
}

export default function AdBanner({
  category = "front_cover",
  variant,
  className = "",
}: AdBannerProps) {
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLAnchorElement>(null);
  const impressionRecorded = useRef(false);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const ads = await getActiveAdsByCategory(category);
        if (ads.length > 0) {
          const randomIndex = Math.floor(Math.random() * ads.length);
          setAd(ads[randomIndex]);
        }
      } catch (err) {
        console.error("Failed to fetch advertisement", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAd();
  }, [category]);

  useEffect(() => {
    if (!ad || !containerRef.current || impressionRecorded.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          incrementAdImpression(ad.id);
          impressionRecorded.current = true;
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [ad]);

  // Requirements: 
  // 1. If no active ad exists for a position, do not render any placeholder or fallback image. 
  // 2. Hide the ad component completely.
  if (loading || !ad) return null;

  const handleClick = (e: React.MouseEvent) => {
    // We do NOT use e.preventDefault() here because we are using an actual <a> tag
    // but we can increment the click asynchronously
    incrementAdClick(ad.id);
  };

  const heights: Record<string, string> = {
    front_cover: "h-48 md:h-[400px]",
    front_inner_cover: "h-40 md:h-[350px]",
    back_inner_cover: "h-40 md:h-[350px]",
    back_cover: "h-48 md:h-[400px]",
    full_page: "h-[450px] md:h-[600px]",
    half_page: "h-[250px] md:h-[300px]",
    leaderboard: "h-20 md:h-24",
    sidebar: "h-64",
    inline: "h-28"
  };

  const adHeightClass = heights[category] || heights[variant || "leaderboard"];

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 ${className}`}>
      <a
        ref={containerRef}
        href={ad.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`block w-full ${adHeightClass} rounded-xl border border-border-subtle bg-surface-light overflow-hidden relative group`}
      >
        <Image
          src={ad.imageUrl}
          alt={ad.title || "Advertisement"}
          fill
          className="object-cover transition-opacity hover:opacity-95"
          sizes="100vw"
        />
        <div className="absolute top-0 right-0 bg-black/60 text-white/80 text-[10px] px-2 py-0.5 rounded-bl-md z-10 font-medium">
          Advertisement
        </div>
      </a>
      <p className="text-[10px] text-muted/40 text-center mt-1 uppercase tracking-widest">
        Ad
      </p>
    </div>
  );
}
