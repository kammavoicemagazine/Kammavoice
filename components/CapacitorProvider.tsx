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
      {/* Render children layout */}
      {children}
    </>
  );
}
