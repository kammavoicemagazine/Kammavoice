"use client";

import { useEffect, useState } from "react";
import { initCapacitor, onOfflineChange, enablePullToRefresh, isNativePlatform } from "@/lib/capacitor-init";
import { motion, AnimatePresence } from "framer-motion";
import OfflineScreen from "@/components/OfflineScreen";

/**
 * CapacitorProvider — wraps the app to initialize all native behaviors,
 * displays a cinematic animated splash screen, and handles offline states.
 */
export default function CapacitorProvider({ children }: { children: React.ReactNode }) {
  const [offline, setOffline] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Initialize Capacitor native behaviors
    initCapacitor()
      .then(() => setInitialized(true))
      .catch((err) => {
        console.warn("[KV-App] Capacitor init warning:", err);
        setInitialized(true);
      });

    // Subscribe to offline state changes
    const unsubscribe = onOfflineChange((isOffline) => {
      setOffline(isOffline);
    });

    // Enable pull-to-refresh on the root document
    if (isNativePlatform) {
      enablePullToRefresh();
    }

    // Register offline service worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => console.log("[KV-SW] Service Worker registered scope:", reg.scope))
        .catch((err) => console.warn("[KV-SW] Service Worker registration failed:", err));
    }

    // Dismiss client splash after 2.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // Show offline screen when no internet and not in intro splash
  if (offline && !showSplash) {
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
            exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0A0A0A] overflow-hidden"
          >
            {/* Animated Ambient Gold Glow Background */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0.15, 0.35, 0.15], scale: [0.9, 1.15, 0.9] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-[350px] h-[350px] bg-[#C9A84C]/10 blur-[100px] rounded-full"
            />

            {/* Branded elements */}
            <div className="relative flex flex-col items-center z-10">
              {/* Logo block with initial bounce and ongoing pulse */}
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 12, delay: 0.1 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#C9A84C] to-[#9E8236] flex items-center justify-center text-[#0A0A0A] font-bold text-3xl font-[family-name:var(--font-playfair)] shadow-[0_8px_32px_rgba(201,168,76,0.3)] mb-6"
              >
                KV
              </motion.div>

              {/* Title brand */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-2xl font-bold tracking-widest bg-gradient-to-r from-[#C9A84C] via-[#E2C779] to-[#C9A84C] bg-clip-text text-transparent font-[family-name:var(--font-playfair)]"
              >
                KAMMA VOICE
              </motion.h1>

              {/* Subtitle brand */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-[10px] text-gray-400 tracking-widest uppercase mt-1.5"
              >
                కమ్మ వాయిస్
              </motion.p>
            </div>

            {/* Lower indicator spinner */}
            <div className="absolute bottom-16 flex flex-col items-center">
              <div className="w-5 h-5 border-2 border-[#C9A84C]/20 border-t-[#C9A84C] rounded-full animate-spin mb-3" />
              <span className="text-[9px] text-gray-500 tracking-widest uppercase font-semibold">
                Initializing Experience
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
