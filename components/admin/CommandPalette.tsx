"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, BookOpen, Image as ImageIcon, Settings, Cpu, ChevronRight, X } from "lucide-react";
import { useAdminStore } from "@/lib/admin-store";
import { getAllArticles, getAllMagazines } from "@/lib/firestore";
import type { Article, Magazine } from "@/lib/types";

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Articles" | "Magazines" | "Media" | "AI Center" | "Settings";
  href: string;
  icon: any;
}

const DEFAULT_ITEMS: SearchItem[] = [
  { id: "ai-center", title: "AI Control Center", subtitle: "Manage Gemini API queues and OCR pipelines", category: "AI Center", href: "/admin/ai-center", icon: Cpu },
  { id: "media-lib", title: "Media Library Pro", subtitle: "Cloudinary assets, auto-tagging, bulk upload", category: "Media", href: "/admin/media", icon: ImageIcon },
  { id: "settings-gen", title: "General Settings", subtitle: "Configure platform defaults, API keys, branding", category: "Settings", href: "/admin/settings", icon: Settings },
  { id: "analytics", title: "Advanced Analytics", subtitle: "Real-time traffic, AI token usage, readership graphs", category: "Settings", href: "/admin/analytics", icon: FileText },
];

export default function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>(DEFAULT_ITEMS);
  const [, startTransition] = useTransition();

  // Handle Ctrl+K / Cmd+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      } else if (e.key === "Escape" && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  // Load real Articles and Magazines into search pool
  useEffect(() => {
    if (!commandPaletteOpen) return;

    let isMounted = true;

    startTransition(async () => {
      try {
        const [articles, magazines] = await Promise.all([
          getAllArticles(),
          getAllMagazines(),
        ]);

        if (!isMounted) return;

        const articleItems: SearchItem[] = articles.map((a) => ({
          id: `art-${a.id}`,
          title: a.title,
          subtitle: `Article • ${a.category} • ${a.isPublished ? "Published" : "Draft"}`,
          category: "Articles",
          href: `/admin/articles/${a.id}/edit`,
          icon: FileText,
        }));

        const magazineItems: SearchItem[] = magazines.map((m) => ({
          id: `mag-${m.id}`,
          title: m.title,
          subtitle: `Magazine • ${m.category} • ${m.year}`,
          category: "Magazines",
          href: `/admin/magazines/${m.id}/edit`,
          icon: BookOpen,
        }));

        setItems([...DEFAULT_ITEMS, ...articleItems, ...magazineItems]);
      } catch (error) {
        console.error("Failed to load search pool:", error);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [commandPaletteOpen]);

  // Fuzzy filter logic
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleSelect = (href: string) => {
    setCommandPaletteOpen(false);
    setSearchQuery("");
    router.push(href);
  };

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setCommandPaletteOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-2xl rounded-2xl bg-[#141414] border border-border-subtle shadow-2xl overflow-hidden text-foreground flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3 border-b border-border-subtle bg-[#1A1A1A]">
              <Search className="w-5 h-5 text-gold shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search articles, magazines, AI jobs, settings... (Press Esc to close)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none px-3 py-1.5 text-base text-foreground placeholder-muted focus:outline-none focus:ring-0"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results Container */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-border-subtle/50">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted text-sm">No results found for &quot;{searchQuery}&quot;</p>
                  <p className="text-xs text-muted/70 mt-1">Try searching for something else or check your spelling.</p>
                </div>
              ) : (
                Object.entries(
                  filteredItems.reduce((acc, item) => {
                    acc[item.category] = acc[item.category] || [];
                    acc[item.category].push(item);
                    return acc;
                  }, {} as Record<string, SearchItem[]>)
                ).map(([category, catItems]) => (
                  <div key={category} className="py-2 first:pt-0 last:pb-0">
                    <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold/80 mb-1">
                      {category}
                    </p>
                    <div className="space-y-0.5">
                      {catItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item.href)}
                          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-hover hover:border-gold/20 border border-transparent transition-all group text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-gold group-hover:scale-105 transition-transform shrink-0">
                              <item.icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground group-hover:text-gold transition-colors truncate">
                                {item.title}
                              </p>
                              <p className="text-xs text-muted truncate mt-0.5">{item.subtitle}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0 ml-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-border-subtle bg-[#1A1A1A] flex items-center justify-between text-xs text-muted">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-surface border border-border-subtle font-mono text-[10px]">Ctrl K</span>
                <span>to open anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-surface border border-border-subtle font-mono text-[10px]">Esc</span>
                <span>to close</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
