"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search, ChevronRight } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home", labelTe: "హోమ్" },
  { href: "/magazine", label: "Magazine", labelTe: "మ్యాగజైన్" },
  { href: "/news", label: "News", labelTe: "వార్తలు" },
  { href: "/gallery", label: "Gallery", labelTe: "గ్యాలరీ" },
  { href: "/videos", label: "Videos", labelTe: "వీడియోలు" },
  { href: "/about", label: "About", labelTe: "గురించి" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileOpen]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "glass py-3" : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-gold flex items-center justify-center text-[#0A0A0A] font-bold text-lg font-[family-name:var(--font-playfair)]">
                KV
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold tracking-wide text-gold-gradient font-[family-name:var(--font-playfair)]">
                  KAMMA VOICE
                </h1>
                <p className="text-[10px] text-muted tracking-widest uppercase -mt-0.5">
                  కమ్మ వాయిస్
                </p>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="gold-underline px-4 py-2 text-sm font-medium text-[#CCCCCC] hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="w-11 h-11 flex items-center justify-center rounded-lg text-muted hover:text-gold hover:bg-surface-light transition-all cursor-pointer"
                aria-label="Toggle search"
                id="search-toggle"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden w-11 h-11 flex items-center justify-center rounded-lg text-muted hover:text-gold hover:bg-surface-light transition-all cursor-pointer"
                aria-label="Toggle menu"
                id="mobile-menu-toggle"
              >
                {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 pb-2">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="text"
                      placeholder="Search articles... వార్తలు వెతకండి..."
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface border border-border-subtle text-sm text-foreground placeholder-muted focus:outline-none focus:border-gold/40 transition-colors"
                      autoFocus
                      id="search-input"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[280px] bg-surface border-l border-border-subtle flex flex-col lg:hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-5 border-b border-border-subtle">
                <span className="text-gold font-bold font-[family-name:var(--font-playfair)] tracking-wide">
                  KAMMA VOICE
                </span>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 rounded-lg text-muted hover:text-white hover:bg-surface-hover transition-all cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Links */}
              <div className="flex-1 py-4 overflow-y-auto">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileOpen(false)}
                      className="flex items-center justify-between px-6 py-3.5 text-[#CCCCCC] hover:text-gold hover:bg-surface-hover transition-all group"
                    >
                      <div>
                        <span className="block text-sm font-medium">{link.label}</span>
                        <span className="block text-[11px] text-muted">{link.labelTe}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted group-hover:text-gold transition-colors" />
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Drawer Footer */}
              <div className="p-5 border-t border-border-subtle">
                <p className="text-[11px] text-muted text-center">
                  కమ్మ వాయిస్ © {new Date().getFullYear()}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
