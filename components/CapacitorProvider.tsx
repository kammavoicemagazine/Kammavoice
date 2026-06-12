"use client";

import { useEffect, useState, useRef } from "react";
import { initCapacitor, onOfflineChange, enablePullToRefresh, isNativePlatform } from "@/lib/capacitor-init";

import { motion, AnimatePresence } from "framer-motion";
import OfflineScreen from "@/components/OfflineScreen";
import { useRouter, usePathname } from "next/navigation";
import { useUIStore } from "@/lib/store/ui-store";
import { motionCurves, motionSprings, useMotionProfile } from "@/lib/motion";

/**
 * CapacitorProvider — wraps the app to initialize all native behaviors,
 * displays a cinematic animated splash screen, and handles offline states.
 */
export default function CapacitorProvider({ children }: { children: React.ReactNode }) {
  const [offline, setOffline] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const isFirstCheck = useRef(true);
  const motionProfile = useMotionProfile();

  useEffect(() => {
    // Initialize Capacitor native behaviors
    initCapacitor()
      .then(() => {
        setInitialized(true);
      })
      .catch((err) => {
        console.warn("[KV-App] Capacitor init warning:", err);
        setInitialized(true);
      });

    // Subscribe to offline state changes
    const unsubscribe = onOfflineChange((isOffline) => {
      setOffline(isOffline);
      if (isFirstCheck.current) {
        isFirstCheck.current = false;
        return;
      }
      const store = useUIStore.getState();
      if (isOffline) {
        store.showAlert({
          title: "Connection Lost",
          subtitle: "Browsing in offline mode.",
          type: "error",
          duration: 4000
        });
      } else {
        store.showAlert({
          title: "Back Online",
          subtitle: "Synchronizing media feeds...",
          type: "success",
          duration: 4000
        });
      }
    });

    // Enable pull-to-refresh on the root document
    if (isNativePlatform) {
      enablePullToRefresh();
    }

    // Register offline service worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      if (window.location.hostname === "localhost") {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          let hasUnregistered = false;
          for (const registration of registrations) {
            registration.unregister().then((success) => {
              if (success) {
                console.log("[KV-SW] Cleaned up stale service worker on localhost");
                hasUnregistered = true;
              }
            });
          }
          if (hasUnregistered) {
            // Force browser reload to clear service worker controls and stale caches
            window.location.reload();
          }
        });
      } else {
        navigator.serviceWorker.register("/sw.js")
          .then((reg) => console.log("[KV-SW] Service Worker registered scope:", reg.scope))
          .catch((err) => console.warn("[KV-SW] Service Worker registration failed:", err));
      }
    }

    // Dismiss client splash after 2.8 seconds (cinematic flow)
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2800);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // Show offline screen when no internet, not in splash, and NOT browsing the reader page
  const isBrowsingOfflineContent = pathname.startsWith("/magazine/");
  if (offline && !showSplash && !isBrowsingOfflineContent) {
    return (
      <OfflineScreen
        onRetry={() => {
          if (navigator.onLine) {
            setOffline(false);
            window.location.reload();
          }
        }}
      />
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ 
              y: motionProfile.reduce ? 0 : "-8%", 
              opacity: 0,
              transition: { duration: motionProfile.reduce ? 0.2 : 0.58, ease: motionCurves.cinematic } 
            }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0A0A0A] overflow-hidden"
          >
            {/* Ambient Radial Golden Glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: motionProfile.reduce ? 0.18 : [0.12, 0.28, 0.12], scale: motionProfile.reduce ? 1 : [0.86, 1.12, 0.86] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-[360px] h-[360px] bg-[#C9A84C]/10 blur-[96px] rounded-full pointer-events-none hw-accelerated"
            />
            <div className="absolute inset-x-8 top-1/2 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

            {/* Branded elements */}
            <div className="relative flex flex-col items-center z-10">
              {/* Logo block with initial bounce and ongoing pulse */}
              <motion.div
                initial={{ scale: 0.82, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ ...motionSprings.soft, delay: 0.15 }}
                className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-[#C9A84C] via-[#E2C779] to-[#9E8236] flex items-center justify-center text-[#0A0A0A] font-extrabold text-4xl font-[family-name:var(--font-playfair)] mb-6 border border-white/10 gold-glow-soft hw-accelerated"
                style={{
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                KV
              </motion.div>

              {/* Title brand */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.52, ease: motionCurves.cinematic, delay: 0.42 }}
                className="text-3xl font-extrabold tracking-[0.2em] bg-gradient-to-r from-[#C9A84C] via-[#F4E3A4] to-[#C9A84C] bg-clip-text text-transparent font-[family-name:var(--font-playfair)]"
              >
                KAMMA VOICE
              </motion.h1>

              {/* Subtitle brand */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="text-xs text-gray-400 tracking-[0.3em] uppercase mt-2.5 font-semibold"
              >
                కమ్మ వాయిస్
              </motion.p>
            </div>

            {/* Lower indicator spinner */}
            <div className="absolute bottom-20 flex flex-col items-center pointer-events-none">
              <div className="w-28 h-1 rounded-full bg-white/5 overflow-hidden mb-4">
                <motion.div
                  className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-gold to-transparent"
                  animate={{ x: ["-100%", "220%"] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <span className="text-[10px] text-gray-500 tracking-[0.2em] uppercase font-bold">
                Cinematic Experience
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Render children layout */}
      {children}
    </>
  );
}
