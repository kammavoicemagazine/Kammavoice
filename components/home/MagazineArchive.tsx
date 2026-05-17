"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Globe } from "lucide-react";
import type { Magazine } from "@/lib/types";

export default function MagazineArchive({ magazines }: { magazines: Magazine[] }) {
  if (magazines.length === 0) return null;

  // Group magazines by year (extracted from issueDate, assuming format like "May 2026")
  const grouped = magazines.reduce((acc, mag) => {
    const yearMatch = mag.issueDate.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : "Recent";
    if (!acc[year]) acc[year] = [];
    acc[year].push(mag);
    return acc;
  }, {} as Record<string, Magazine[]>);

  // Sort years descending
  const sortedYears = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <section className="py-16 border-t border-border-subtle bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-playfair)]">
              Magazine Archive
            </h2>
            <p className="text-muted mt-2">Explore our previous editions</p>
          </div>
        </div>

        <div className="space-y-16">
          {sortedYears.map((year) => (
            <div key={year}>
              <div className="flex items-center gap-4 mb-8">
                <h3 className="text-2xl font-bold text-gold">{year}</h3>
                <div className="h-px bg-border-subtle flex-1" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
                {grouped[year].map((magazine) => (
                  <Link
                    key={magazine.id}
                    href={`/magazine/${magazine.id}`}
                    className="group block"
                  >
                    <div className="relative aspect-[3/4] w-full rounded-sm overflow-hidden shadow-lg transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-gold/10 border border-border-subtle group-hover:border-gold/30">
                      <Image
                        src={magazine.coverImageUrl}
                        alt={magazine.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                      />
                      
                      {/* Multilingual AI Badge */}
                      {magazine.translationStatus?.totalTranslatedPages ? (
                        <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md border border-gold/40 text-gold text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg">
                          <Globe className="w-3 h-3 animate-pulse" /> Multilingual AI
                        </div>
                      ) : null}

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-20">
                        <span className="flex items-center gap-2 text-white font-medium bg-gold/90 px-4 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform">
                          Read <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-center">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-gold transition-colors">
                        {magazine.issueDate.replace(/\s\d{4}/, "") /* Show only month/name */}
                      </p>
                      <p className="text-[11px] text-muted truncate mt-0.5">
                        {magazine.volume}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
