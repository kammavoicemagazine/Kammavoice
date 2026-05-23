/**
 * Kamma Voice — Capacitor Native Integration Module
 *
 * Initializes all native Android behaviors:
 *  • Smart back-button handling (double-tap to exit at root)
 *  • Status bar theming (dark luxury aesthetic)
 *  • Splash screen lifecycle
 *  • Offline detection & reconnection
 *  • Pull-to-refresh via overscroll
 *  • Immersive fullscreen for magazine reader
 *  • Deep link routing
 *  • App version check architecture
 *  • Performance monitoring hooks
 *  • Security: block external navigation
 */

import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style as StatusBarStyle } from "@capacitor/status-bar";
import { Browser } from "@capacitor/browser";
import { Share } from "@capacitor/share";
import {
  requestPushPermission,
  registerForPushNotifications,
  onNotificationTapped
} from "./push-notifications";

// ─── Platform Detection ──────────────────────────────────────────────
export const isNativePlatform = Capacitor.isNativePlatform();
export const isAndroid = Capacitor.getPlatform() === "android";

// ─── Constants ───────────────────────────────────────────────────────
const DARK_BG = "#0A0A0A";
const APP_VERSION = "1.0.0";
const APP_BUILD = 1;
const BACK_EXIT_DELAY_MS = 2000;

// ─── State ───────────────────────────────────────────────────────────
let lastBackPress = 0;
let isOffline = false;
let offlineCallbacks: Array<(offline: boolean) => void> = [];
let isImmersiveMode = false;

/**
 * Master initializer — call once from root layout on client mount.
 */
export async function initCapacitor(): Promise<void> {
  if (!isNativePlatform) return;

  await initStatusBar();
  await initBackButton();
  await initSplashScreen();
  initOfflineDetection();
  initSecurityGuards();
  initPerformanceMonitoring();
  initDeepLinks();

  // Push notifications setup
  try {
    const granted = await requestPushPermission();
    if (granted) {
      await registerForPushNotifications();
    }
    onNotificationTapped((payload) => {
      if (payload.deepLink) {
        window.location.href = payload.deepLink;
      }
    });
  } catch (err) {
    console.warn("[KV-App] Push notifications registration warning:", err);
  }

  console.log(`[KV-App] Capacitor initialized v${APP_VERSION} (build ${APP_BUILD})`);
}

// ─── Status Bar ──────────────────────────────────────────────────────
async function initStatusBar(): Promise<void> {
  try {
    await StatusBar.setStyle({ style: StatusBarStyle.Dark });
    await StatusBar.setBackgroundColor({ color: DARK_BG });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (err) {
    console.warn("[KV-App] StatusBar init failed:", err);
  }
}

/** Hide status bar for immersive reading */
export async function enterImmersiveMode(): Promise<void> {
  if (!isNativePlatform) return;
  try {
    await StatusBar.hide();
    isImmersiveMode = true;
  } catch (err) {
    console.warn("[KV-App] Immersive mode failed:", err);
  }
}

/** Restore status bar after reading */
export async function exitImmersiveMode(): Promise<void> {
  if (!isNativePlatform) return;
  try {
    await StatusBar.show();
    await StatusBar.setStyle({ style: StatusBarStyle.Dark });
    await StatusBar.setBackgroundColor({ color: DARK_BG });
    isImmersiveMode = false;
  } catch (err) {
    console.warn("[KV-App] Exit immersive failed:", err);
  }
}

// ─── Back Button (Double-Tap to Exit) ────────────────────────────────
async function initBackButton(): Promise<void> {
  await CapApp.addListener("backButton", ({ canGoBack }) => {
    // If immersive mode is active, exit it first
    if (isImmersiveMode) {
      exitImmersiveMode();
      return;
    }

    // If the WebView has navigation history, go back
    if (canGoBack) {
      window.history.back();
      return;
    }

    // At root — require double-tap to exit
    const now = Date.now();
    if (now - lastBackPress < BACK_EXIT_DELAY_MS) {
      CapApp.exitApp();
    } else {
      lastBackPress = now;
      // Show a toast-like message via DOM injection
      showExitToast();
    }
  });
}

function showExitToast(): void {
  // Check if toast already exists
  if (document.getElementById("kv-exit-toast")) return;

  const toast = document.createElement("div");
  toast.id = "kv-exit-toast";
  toast.textContent = "Press back again to exit";
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(201, 168, 76, 0.95);
    color: #0A0A0A;
    padding: 10px 24px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 700;
    z-index: 99999;
    pointer-events: none;
    animation: kvToastFade 2s ease forwards;
    box-shadow: 0 4px 24px rgba(201, 168, 76, 0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  // Inject animation keyframes if not present
  if (!document.getElementById("kv-toast-styles")) {
    const style = document.createElement("style");
    style.id = "kv-toast-styles";
    style.textContent = `
      @keyframes kvToastFade {
        0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
        15% { opacity: 1; transform: translateX(-50%) translateY(0); }
        75% { opacity: 1; }
        100% { opacity: 0; transform: translateX(-50%) translateY(-5px); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// ─── Splash Screen ───────────────────────────────────────────────────
async function initSplashScreen(): Promise<void> {
  // Wait for the page to fully render before hiding splash
  if (document.readyState === "complete") {
    await hideSplash();
  } else {
    window.addEventListener("load", () => hideSplash(), { once: true });
  }
}

async function hideSplash(): Promise<void> {
  // Transfer immediately to client-side animated splash
  await new Promise((r) => setTimeout(r, 100));
  try {
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch (err) {
    console.warn("[KV-App] Splash hide failed:", err);
  }
}

// ─── Offline Detection ───────────────────────────────────────────────
function initOfflineDetection(): void {
  const update = () => {
    const offline = !navigator.onLine;
    if (offline !== isOffline) {
      isOffline = offline;
      offlineCallbacks.forEach((cb) => cb(isOffline));
    }
  };

  window.addEventListener("online", update);
  window.addEventListener("offline", update);

  // Initial check
  update();
}

/** Subscribe to offline state changes */
export function onOfflineChange(callback: (offline: boolean) => void): () => void {
  offlineCallbacks.push(callback);
  // Immediately invoke with current state
  callback(isOffline);
  return () => {
    offlineCallbacks = offlineCallbacks.filter((cb) => cb !== callback);
  };
}

/** Get current offline state */
export function getIsOffline(): boolean {
  return isOffline;
}

// ─── Security Guards ─────────────────────────────────────────────────
function initSecurityGuards(): void {
  // Intercept external link clicks and open in system browser
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest("a") as HTMLAnchorElement | null;

    if (!anchor || !anchor.href) return;

    const url = new URL(anchor.href, window.location.origin);
    const isInternal =
      url.hostname === "kammavoicemmag.vercel.app" ||
      url.hostname === "www.kammavoice.com" ||
      url.hostname === "localhost" ||
      url.hostname === window.location.hostname;

    if (!isInternal && url.protocol.startsWith("http")) {
      e.preventDefault();
      e.stopPropagation();
      Browser.open({ url: anchor.href });
    }
  });
}

// ─── Performance Monitoring ──────────────────────────────────────────
function initPerformanceMonitoring(): void {
  // Track page load performance
  window.addEventListener("load", () => {
    const timing = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    if (timing) {
      console.log(`[KV-Perf] DOM Interactive: ${Math.round(timing.domInteractive)}ms`);
      console.log(`[KV-Perf] DOM Complete: ${Math.round(timing.domComplete)}ms`);
      console.log(`[KV-Perf] Load Event: ${Math.round(timing.loadEventEnd)}ms`);
    }
  });

  // Track unhandled errors (WebView crash detection)
  window.addEventListener("error", (e) => {
    console.error(`[KV-Crash] Unhandled error: ${e.message} at ${e.filename}:${e.lineno}`);
  });

  window.addEventListener("unhandledrejection", (e) => {
    console.error(`[KV-Crash] Unhandled rejection: ${e.reason}`);
  });

  // Network error tracking
  const origFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await origFetch(...args);
      if (!response.ok) {
        console.warn(`[KV-Network] HTTP ${response.status}: ${args[0]}`);
      }
      return response;
    } catch (err) {
      console.error(`[KV-Network] Fetch failed: ${args[0]}`, err);
      throw err;
    }
  };
}

// ─── Deep Link Routing ───────────────────────────────────────────────
function initDeepLinks(): void {
  CapApp.addListener("appUrlOpen", (data) => {
    console.log("[KV-DeepLink] Opened with URL:", data.url);

    try {
      const url = new URL(data.url);
      const path = url.pathname;

      // Route deep links to the appropriate page
      if (path.startsWith("/news/") || path.startsWith("/magazine/")) {
        window.location.href = path;
      }
    } catch (err) {
      console.warn("[KV-DeepLink] Failed to parse URL:", err);
    }
  });
}

// ─── Pull-to-Refresh ─────────────────────────────────────────────────
/**
 * Call this to enable pull-to-refresh on a specific scrollable element.
 * Uses native overscroll behavior detection.
 */
export function enablePullToRefresh(element?: HTMLElement): void {
  const target = element || document.documentElement;
  let startY = 0;
  let isPulling = false;

  target.addEventListener("touchstart", (e) => {
    if (target.scrollTop === 0) {
      startY = (e as TouchEvent).touches[0].clientY;
      isPulling = true;
    }
  }, { passive: true });

  target.addEventListener("touchmove", (e) => {
    if (!isPulling) return;
    const currentY = (e as TouchEvent).touches[0].clientY;
    const delta = currentY - startY;

    if (delta > 120 && target.scrollTop === 0) {
      isPulling = false;
      window.location.reload();
    }
  }, { passive: true });

  target.addEventListener("touchend", () => {
    isPulling = false;
  }, { passive: true });
}

// ─── App Version Check ───────────────────────────────────────────────
export interface AppVersionInfo {
  currentVersion: string;
  currentBuild: number;
  latestVersion?: string;
  updateAvailable?: boolean;
  updateUrl?: string;
}

/** Get current app version info */
export function getAppVersionInfo(): AppVersionInfo {
  return {
    currentVersion: APP_VERSION,
    currentBuild: APP_BUILD,
  };
}

export async function checkForUpdate(): Promise<AppVersionInfo> {
  const info = getAppVersionInfo();

  try {
    // Future: fetch from your own API endpoint
    // const res = await fetch("https://kammavoicemmag.vercel.app/api/app-version");
    // const data = await res.json();
    // info.latestVersion = data.version;
    // info.updateAvailable = data.version !== APP_VERSION;
    // info.updateUrl = data.playStoreUrl;
    console.log("[KV-Update] Version check architecture ready");
  } catch (err) {
    console.warn("[KV-Update] Version check failed:", err);
  }

  return info;
}

/**
 * Share content natively via Android Share Sheet or Web Share API.
 */
export async function shareContent(title: string, text: string, url: string): Promise<void> {
  if (isNativePlatform) {
    try {
      await Share.share({
        title,
        text,
        url,
        dialogTitle: "Share this article",
      });
    } catch (err) {
      console.warn("[KV-App] Share failed or cancelled:", err);
    }
  } else {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        console.warn("[WebShare] Failed:", err);
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error("[WebShare] Clipboard copy failed:", err);
      }
    }
  }
}

