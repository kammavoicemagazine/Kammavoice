"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MagazineArchive from "@/components/home/MagazineArchive";
import { getMagazines } from "@/lib/firestore";
import type { Magazine } from "@/lib/types";
import { MagazineCardSkeleton } from "@/components/ui/skeleton";

export default function MagazinesPage() {
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    getMagazines(50)
      .then(setMagazines)
      .finally(() => setLoading(false));
  }, []);

  const years = Array.from(new Set(magazines.map((m) => m.year || new Date().getFullYear()))).sort((a, b) => b - a);
  const categories = Array.from(new Set(magazines.map((m) => m.category || "Monthly"))).sort();

  const filteredMagazines = magazines.filter((m) => {
    const mYear = m.year || new Date().getFullYear();
    const mCat = m.category || "Monthly";
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) || 
                          (m.tags && m.tags.some(t => t.toLowerCase().includes(search.toLowerCase())));
    const matchesYear = yearFilter === "All" || mYear.toString() === yearFilter;
    const matchesCat = categoryFilter === "All" || mCat === categoryFilter;
    return matchesSearch && matchesYear && matchesCat;
  });

  return (
    <>
      <Navbar />
      <div className="h-[72px]" />

      <main className="min-h-screen bg-[#0A0A0A]">
        {/* Simple Header */}
        <div className="py-16 bg-surface border-b border-border-subtle text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 font-[family-name:var(--font-playfair)]">
            Digital Magazine
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto px-4 mb-8">
            Browse our complete archive of Kamma Voice digital magazines. Read the latest issues and explore our rich history.
          </p>

          {/* Filters */}
          <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <input 
              type="text" 
              placeholder="Search by title or tag..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 px-4 py-2.5 rounded-lg bg-[#0A0A0A] border border-border-subtle text-sm text-foreground placeholder-muted focus:outline-none focus:border-gold/40 transition-colors"
            />
            <select 
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full sm:w-40 px-4 py-2.5 rounded-lg bg-[#0A0A0A] border border-border-subtle text-sm text-foreground focus:outline-none focus:border-gold/40 transition-colors"
            >
              <option value="All">All Years</option>
              {years.map(y => <option key={y} value={y.toString()}>{y}</option>)}
            </select>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-48 px-4 py-2.5 rounded-lg bg-[#0A0A0A] border border-border-subtle text-sm text-foreground focus:outline-none focus:border-gold/40 transition-colors"
            >
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <MagazineCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredMagazines.length > 0 ? (
          <MagazineArchive magazines={filteredMagazines} />
        ) : (
          <div className="text-center py-32">
            <p className="text-muted text-lg">No magazines found matching your criteria.</p>
            <button onClick={() => {setSearch(""); setYearFilter("All"); setCategoryFilter("All");}} className="mt-4 text-gold hover:underline">
              Clear Filters
            </button>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
