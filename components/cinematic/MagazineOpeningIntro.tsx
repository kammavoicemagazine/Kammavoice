"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GoldGradientDefs,
  SacredNamam,
  SacredShanku,
  SacredChakra,
} from "./SacredIconography";
import { SkipForward } from "lucide-react";

const APPLE_EASE = [0.16, 1, 0.3, 1] as const;

interface MagazineOpeningIntroProps {
  title?: string;
  coverUrl?: string;
  onComplete?: () => void;
}

export default function MagazineOpeningIntro({
  title = "Kamma Voice Magazine",
  coverUrl,
  onComplete,
}: MagazineOpeningIntroProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [canSkip, setCanSkip] = useState(false);

  const handleFinish = useCallback(() => {
    setIsVisible(false);
    if (onComplete) onComplete();
  }, [onComplete]);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) {
      handleFinish();
      return;
    }

    const skipTimer = setTimeout(() => setCanSkip(true), 400);

    // Max 1.4s duration to strictly satisfy <1.5s
    const endTimer = setTimeout(() => handleFinish(), 1400);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        handleFinish();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(endTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleFinish]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="magazine-opening-intro"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.35, ease: APPLE_EASE } }}
        onClick={() => canSkip && handleFinish()}
        className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#050505] text-white overflow-hidden select-none cursor-pointer"
        role="dialog"
        aria-label="Magazine Opening Sequence"
      >
        <GoldGradientDefs />

        {/* Step 1: Golden Glow Ambient Lighting */}
        <motion.div
          initial={{ opacity: 0.2, scale: 0.8 }}
          animate={{ opacity: [0.2, 0.7, 0.4], scale: [0.8, 1.1, 1.3] }}
          transition={{ duration: 1.3, ease: APPLE_EASE }}
          className="absolute inset-0 bg-radial from-[#D4AF37]/20 via-[#0A0A0A]/90 to-[#050505] pointer-events-none"
        />

        {/* Step 4: Wooden Reading Desk Backdrop (Smooth fade-in) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0.85] }}
          transition={{ duration: 1.3, times: [0, 0.5, 1], ease: APPLE_EASE }}
          className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-85 shadow-inner"
          style={{ backgroundImage: `url('/images/wood-texture.png')` }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-brightness-90" />
        </motion.div>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center justify-center max-w-sm px-4 text-center">
          
          {/* Step 2: Golden Namam flanked by Shanku & Chakra */}
          <div className="flex items-center justify-center gap-5 mb-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 1, 0.4], scale: [0.8, 1, 0.9] }}
              transition={{ duration: 1.1, ease: APPLE_EASE }}
            >
              <SacredShanku className="w-9 h-9 sm:w-11 sm:h-11" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.85 }}
              animate={{ opacity: [0, 1, 0.6], y: 0, scale: [0.85, 1.1, 1] }}
              transition={{ duration: 1.1, ease: APPLE_EASE }}
              className="drop-shadow-[0_0_20px_rgba(245,208,97,0.5)]"
            >
              <SacredNamam className="w-12 h-16 sm:w-14 sm:h-18" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 1, 0.4], scale: [0.8, 1, 0.9] }}
              transition={{ duration: 1.1, ease: APPLE_EASE }}
            >
              <SacredChakra className="w-9 h-9 sm:w-11 sm:h-11" />
            </motion.div>
          </div>

          {/* Step 3: Magazine Cover Reveal */}
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.45, ease: APPLE_EASE }}
            className="flex flex-col items-center"
          >
            {coverUrl ? (
              <div className="w-26 h-34 sm:w-30 sm:h-40 rounded-lg shadow-2xl overflow-hidden border border-[#F5D061]/40 mb-2.5 transform rotate-[-1deg]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
            ) : (
              <div className="w-26 h-34 sm:w-30 sm:h-40 rounded-lg bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] border border-[#F5D061]/40 flex flex-col items-center justify-center p-3 mb-2.5 shadow-2xl">
                <span className="text-gold font-bold text-xs font-[family-name:var(--font-playfair)] tracking-wider">
                  KAMMA VOICE
                </span>
              </div>
            )}

            {/* Playfair Display for Magazine Title */}
            <h3 className="text-sm sm:text-base font-bold text-[#F5D061] tracking-wide font-[family-name:var(--font-playfair)] line-clamp-1">
              {title}
            </h3>

            {/* Inter Font for Subtext */}
            <p className="text-[10px] text-[#CCCCCC]/70 tracking-widest uppercase mt-0.5 font-[family-name:var(--font-inter)]">
              Opening Reader...
            </p>
          </motion.div>
        </div>

        {/* Skip button (Inter Font) */}
        <AnimatePresence>
          {canSkip && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                handleFinish();
              }}
              className="absolute bottom-6 right-6 z-20 flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#111111]/80 border border-[#F5D061]/30 backdrop-blur-md text-[11px] font-medium text-[#F5D061] hover:bg-[#1E1E1E] transition-all cursor-pointer font-[family-name:var(--font-inter)] shadow-md"
              aria-label="Skip magazine intro"
            >
              <span>Skip</span>
              <SkipForward className="w-3 h-3" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
