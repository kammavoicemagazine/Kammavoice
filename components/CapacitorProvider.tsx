"use client";

import { useEffect, useState } from "react";
import { initCapacitor, onOfflineChange, enablePullToRefresh, isNativePlatform } from "@/lib/capacitor-init";
import OfflineScreen from "@/components/OfflineScreen";

/**
 * CapacitorProvider — wraps the app to initialize all native behaviors
 * and show the offline screen when connectivity is lost.
 */
export default function CapacitorProvider({ children }: { children: React.ReactNode }) {
  const [offline, setOffline] = useState(false);
  const [initialized, setInitialized] = useState(false);

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

    return unsubscribe;
  }, []);

  // Show offline screen when no internet
  if (offline) {
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

  return <>{children}</>;
}
