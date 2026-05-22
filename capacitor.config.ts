import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.kammavoice.app",
  appName: "Kamma Voice",
  webDir: "public",

  // Load the live Vercel deployment directly — no static export needed.
  // All API routes, Firestore, Gemini AI pipeline, and admin dashboard
  // work exactly as they do in a browser.
  server: {
    url: "https://kammavoicemmag.vercel.app",
    cleartext: false, // HTTPS-only in production
  },

  // Android-specific configuration
  android: {
    // Allow mixed content for development only (set false for production)
    allowMixedContent: false,
    // Capture all navigation within the WebView
    captureInput: true,
    // Enable WebView debugging in development
    webContentsDebuggingEnabled: false,
    // Background color to prevent white flash during load
    backgroundColor: "#0A0A0A",
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: false, // We control dismissal from JS
      backgroundColor: "#0A0A0A",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      spinnerColor: "#C9A84C",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0A0A0A",
    },
  },
};

export default config;
