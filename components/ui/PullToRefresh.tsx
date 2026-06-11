"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ArrowDown } from "lucide-react";
import { triggerLightTap, triggerMediumTap } from "@/lib/haptic-utils";

interface PullToRefreshProps {
  children: React.ReactNode;
}

export default function PullToRefresh({ children }: PullToRefreshProps) {
  const pathname = usePathname();
  const [pullProgress, setPullProgress] = useState(0); // 0 to 100
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [translateY, setTranslateY] = useState(0);

  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hapticTriggeredRef = useRef(false);

  const PULL_THRESHOLD = 75; // px to trigger refresh
  const MAX_PULL = 130; // max px to pull down
  const FRICTION = 0.45; // drag resistance multiplier

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Disable pull-to-refresh on swipe-heavy screens (magazine reader, reels feed, admin panel)
      if (
        pathname.startsWith("/magazine/") ||
        pathname.startsWith("/videos") ||
        pathname.startsWith("/admin")
      ) {
        return;
      }

      // Only pull if scrolled to the absolute top
      if (window.scrollY === 0 && !isRefreshing) {
        startYRef.current = e.touches[0].clientY;
        setIsPulling(true);
        hapticTriggeredRef.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;

      currentYRef.current = e.touches[0].clientY;
      const pullDelta = currentYRef.current - startYRef.current;

      if (pullDelta > 0) {
        // Prevent default browser rubber-banding to let our custom animation run
        if (e.cancelable) e.preventDefault();

        // Apply elastic friction curve
        const pullDistance = Math.min(MAX_PULL, pullDelta * FRICTION);
        setTranslateY(pullDistance);

        const progress = Math.min(100, (pullDistance / PULL_THRESHOLD) * 100);
        setPullProgress(progress);

        // Haptic pulse trigger when reaching threshold
        if (pullDistance >= PULL_THRESHOLD && !hapticTriggeredRef.current) {
          hapticTriggeredRef.current = true;
          triggerMediumTap();
        } else if (pullDistance < PULL_THRESHOLD && hapticTriggeredRef.current) {
          hapticTriggeredRef.current = false;
        }
      } else {
        // Scrolling up - reset values
        setTranslateY(0);
        setPullProgress(0);
      }
    };

    const handleTouchEnd = () => {
      if (!isPulling) return;
      setIsPulling(false);

      if (translateY >= PULL_THRESHOLD) {
        // Trigger reload
        setIsRefreshing(true);
        setTranslateY(55); // resting pull down position
        triggerLightTap();
        
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        // Snap back
        setTranslateY(0);
        setPullProgress(0);
      }
    };

    const doc = document.documentElement;
    doc.addEventListener("touchstart", handleTouchStart, { passive: false });
    doc.addEventListener("touchmove", handleTouchMove, { passive: false });
    doc.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      doc.removeEventListener("touchstart", handleTouchStart);
      doc.removeEventListener("touchmove", handleTouchMove);
      doc.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isPulling, isRefreshing, translateY]);

  return (
    <div className="relative w-full flex-1 flex flex-col overflow-x-hidden">
      {/* Refresh Loading Bubble Overlay */}
      <div 
        className="absolute left-0 right-0 z-50 flex justify-center pointer-events-none transition-all duration-75"
        style={{ 
          top: `${translateY - 45}px`,
          opacity: translateY > 10 ? 1 : 0 
        }}
      >
        <div 
          className="w-10 h-10 rounded-full bg-[#141414]/90 backdrop-blur-md border border-white/[0.08] flex items-center justify-center shadow-lg transition-transform"
          style={{
            transform: `scale(${Math.min(1, pullProgress / 100)}) rotate(${pullProgress * 3.6}deg)`,
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)"
          }}
        >
          {isRefreshing ? (
            <span className="w-5 h-5 rounded-full border border-gold/25 bg-gold/15 live-pulse" />
          ) : (
            <ArrowDown 
              className="w-5 h-5 text-gold transition-transform duration-200" 
              style={{
                transform: pullProgress >= 100 ? "rotate(180deg)" : "rotate(0deg)",
                color: pullProgress >= 100 ? "#E2C779" : "#C9A84C"
              }}
            />
          )}
        </div>
      </div>

      {/* Main Page Scroll Container */}
      <div
        ref={containerRef}
        className="w-full flex-1 flex flex-col transition-transform duration-200"
        style={{
          transform: translateY > 0 ? `translate3d(0, ${translateY}px, 0)` : "none",
          transition: isPulling ? "none" : "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)"
        }}
      >
        {children}
      </div>
    </div>
  );
}
