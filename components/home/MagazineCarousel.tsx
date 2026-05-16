"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import type { Magazine } from "@/lib/types";

export default function MagazineCarousel({ magazines }: { magazines: Magazine[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (!magazines || magazines.length === 0) return null;

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener("resize", handleScroll);
    return () => window.removeEventListener("resize", handleScroll);
  }, [magazines]);

  const scroll = (direction: "left" | "right") => {
    if (!containerRef.current) return;
    const scrollAmount = containerRef.current.clientWidth * 0.8;
    containerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-16 bg-[#111111] border-y border-[#222222] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-playfair)] text-gold">
              Previous Editions
            </h2>
            <p className="text-muted text-sm mt-1">Catch up on our past issues</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="p-2 rounded-full border border-[#333333] hover:bg-[#222222] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="p-2 rounded-full border border-[#333333] hover:bg-[#222222] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Carousel Container */}
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto gap-6 sm:gap-8 pb-8 snap-x snap-mandatory hide-scrollbar"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {magazines.map((magazine, i) => (
            <motion.div
              key={magazine.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="min-w-[200px] w-[200px] sm:min-w-[240px] sm:w-[240px] snap-start flex-shrink-0 group"
            >
              <Link href={`/magazine/${magazine.id}`} className="block">
                <div className="relative aspect-[3/4] w-full rounded-sm overflow-hidden shadow-lg transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-xl group-hover:shadow-gold/10">
                  <Image
                    src={magazine.coverImageUrl}
                    alt={magazine.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 200px, 240px"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <span className="flex items-center gap-2 text-white font-medium bg-gold/90 px-4 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform">
                      Read <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm font-semibold text-foreground truncate group-hover:text-gold transition-colors">
                    {magazine.title}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {magazine.issueDate} • {magazine.category || "Issue"}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
