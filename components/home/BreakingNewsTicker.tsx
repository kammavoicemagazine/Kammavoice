"use client";

import { BREAKING_NEWS } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { Radio } from "lucide-react";
import { triggerLightTap } from "@/lib/haptic-utils";
import { motionCurves, pressTap } from "@/lib/motion";

export default function BreakingNewsTicker() {
  const items = [...BREAKING_NEWS, ...BREAKING_NEWS]; // Duplicate for seamless looping

  return (
    <motion.div 
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.36, ease: motionCurves.cinematic }}
      className="bg-[#141414]/72 backdrop-blur-md border-y border-white/[0.06] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto flex items-center h-11">
        {/* Live Indicator Tab */}
        <motion.button
          onClick={() => triggerLightTap()}
          whileTap={pressTap}
          className="relative flex items-center gap-1.5 px-4 h-full bg-gold/[0.08] border-r border-white/[0.06] shrink-0 cursor-pointer hover:bg-gold/15 transition-all group ripple-touch"
        >
          <span className="relative flex h-2 w-2">
            <span className="live-pulse absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600 shadow-[0_0_8px_#ef4444]"></span>
          </span>
          <Radio className="w-3 h-3 text-gold/70" />
          <span className="text-[10px] font-extrabold text-gold uppercase tracking-[0.15em] whitespace-nowrap group-hover:scale-105 transition-transform">
            Breaking
          </span>
        </motion.button>

        {/* Scrolling Marquee Container */}
        <div className="overflow-hidden flex-1 relative h-full flex items-center">
          {/* Subtle overlay gradients for fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0A0A0A]/50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0A0A0A]/50 to-transparent z-10 pointer-events-none" />

          <div className="ticker-container flex items-center whitespace-nowrap py-1 hw-accelerated">
            <div className="ticker-track flex items-center">
              {items.map((item, i) => (
                <motion.span
                  key={`${item.id}-${i}`}
                  whileTap={pressTap}
                  className="inline-flex items-center px-6 text-xs text-[#DDDDDD] hover:text-gold transition-colors cursor-pointer font-medium ripple-touch"
                  onClick={() => triggerLightTap()}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gold/50 mr-4 shrink-0 shadow-[0_0_4px_#C9A84C]" />
                  {item.textTelugu}
                  <span className="text-[10px] text-gray-500 font-semibold ml-2.5">
                    ({item.text})
                  </span>
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ticker-container {
          overflow: hidden;
          width: 100%;
        }
        .ticker-track {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite;
          will-change: transform;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
        @keyframes marquee {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
      `}</style>
    </motion.div>
  );
}
