"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GoldGradientDefs,
  TirumalaGopuramSilhouette,
} from "./SacredIconography";
import { SubtleGoldAura } from "./SubtleGoldAura";
import { ArrowRight } from "lucide-react";

const STORAGE_KEY = "kv_website_intro_shown_v1";

// Apple-level luxury easing curve (cubic-bezier)
const APPLE_EASE = [0.16, 1, 0.3, 1] as const;

export default function CinematicOpening() {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  const handleComplete = useCallback(() => {
    if (process.env.NODE_ENV === "production") {
      try {
        sessionStorage.setItem(STORAGE_KEY, "true");
      } catch {
        // Ignore
      }
    }
    setIsVisible(false);
  }, []);

  useEffect(() => {
    const isDev = process.env.NODE_ENV !== "production";
    const searchParams = new URLSearchParams(window.location.search);
    const forceReplay = searchParams.get("intro") === "true" || searchParams.get("replay") === "1";

    if (!isDev && !forceReplay) {
      try {
        const shown = sessionStorage.getItem(STORAGE_KEY);
        if (shown === "true") {
          setIsVisible(false);
          return;
        }
      } catch {
        // Fallback
      }
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) {
      setIsReducedMotion(true);
      setIsVisible(true);
      return;
    }

    setIsVisible(true);

    // Global Keypress listener (ESC, Space, Enter to enter site)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        handleComplete();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleComplete]);

  if (isVisible === false || isVisible === null) return null;

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="cinematic-opening-overlay"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02, transition: { duration: 0.8, ease: APPLE_EASE } }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#050505] text-white overflow-hidden select-none px-4 py-6"
          role="dialog"
          aria-label="Sacred Opening Experience"
        >
          {/* SVG Definitions */}
          <GoldGradientDefs />

          {/* Continuous Falling Sacred Flower Petals */}
          <SubtleGoldAura active={!isReducedMotion} />

          {/* Perfectly Centered Sacred Composition Container */}
          <div className="relative z-10 flex flex-col items-center justify-center max-w-xl w-full text-center my-auto">
            
            {/* Step 1: Ananda Nilayam (Tirumala Temple Gopuram) Silhouette */}
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 0.85, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1, ease: APPLE_EASE }}
              className="mb-1 pointer-events-none"
            >
              <TirumalaGopuramSilhouette className="w-20 h-20 sm:w-26 sm:h-26 text-gold opacity-60" glow={false} />
            </motion.div>

            {/* Step 2: High-Definition Sacred Tirumala Pancha-Iconography (Garuda, Chakra, Namam, Shanku, Hanuman) */}
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.25, ease: APPLE_EASE }}
              className="relative z-10 flex justify-center items-center mb-4"
            >
              <img
                src="/images/sacred_pancha_icons.png"
                alt="Sacred Tirumala Pancha Iconography - Garuda Swamy, Sudarshana Chakra, Sacred Namam, Panchajanya Shanku, Hanuman Swamy"
                className="w-full max-w-sm sm:max-w-md md:max-w-lg h-auto object-contain pointer-events-none"
              />
            </motion.div>

            {/* Step 3: Sacred Chant in Noto Serif Telugu */}
            <div className="space-y-1 mb-4">
              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: APPLE_EASE }}
                className="text-2xl sm:text-4xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#FFF2A8] via-[#F5D061] to-[#C5A059] font-[family-name:var(--font-noto-telugu)] leading-tight"
              >
                ఓం నమో వెంకటేశాయ
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.95 }}
                transition={{ duration: 0.6, delay: 0.65, ease: APPLE_EASE }}
                className="text-[11px] sm:text-sm font-semibold tracking-[0.3em] text-[#E6B848] uppercase font-[family-name:var(--font-playfair)]"
              >
                Om Namo Venkatesaya
              </motion.p>
            </div>

            {/* Step 4: Kamma Voice Emblem & Tagline */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8, ease: APPLE_EASE }}
              className="flex flex-col items-center pt-2.5 border-t border-[#F5D061]/20 w-full max-w-md mb-5"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="w-6 h-6 rounded-md bg-gradient-to-br from-[#FFE885] to-[#99701E] text-[#0A0A0A] font-bold text-xs flex items-center justify-center font-[family-name:var(--font-playfair)] shadow-md">
                  KV
                </span>
                <h1 className="text-lg sm:text-xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#FFF2A8] via-[#F5D061] to-[#C5A059] font-[family-name:var(--font-playfair)]">
                  KAMMA VOICE
                </h1>
              </div>
              <p className="text-[9px] sm:text-[11px] text-[#CCCCCC]/80 tracking-[0.2em] uppercase font-[family-name:var(--font-inter)] font-medium">
                Voice of the Global Kamma Community
              </p>
            </motion.div>

            {/* Step 5: "Enter Website / ప్రవేశించండి" Button (Perfectly Centered & Aligned) */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0, ease: APPLE_EASE }}
              onClick={handleComplete}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FFE885] via-[#F5D061] to-[#C5A059] text-[#0A0A0A] font-extrabold text-xs sm:text-sm font-[family-name:var(--font-inter)] shadow-[0_0_20px_rgba(245,208,97,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              aria-label="Enter Website"
            >
              <span>Enter Website / ప్రవేశించండి</span>
              <ArrowRight className="w-4 h-4 text-[#0A0A0A]" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
