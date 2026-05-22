"use client";

import { useState, useEffect } from "react";

interface OfflineScreenProps {
  onRetry: () => void;
}

/**
 * Premium offline screen matching the cinematic dark luxury aesthetic.
 * Shown when the device has no internet connection.
 */
export default function OfflineScreen({ onRetry }: OfflineScreenProps) {
  const [retrying, setRetrying] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);

  const handleRetry = async () => {
    setRetrying(true);
    setPulseKey((k) => k + 1);

    // Give the network a moment to reconnect
    await new Promise((r) => setTimeout(r, 1500));

    if (navigator.onLine) {
      onRetry();
    } else {
      setRetrying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center px-8"
      style={{
        background: "linear-gradient(180deg, #0A0A0A 0%, #111111 50%, #0A0A0A 100%)",
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(201, 168, 76, 0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* WiFi-off icon */}
      <div className="relative mb-8">
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(201, 168, 76, 0.15) 0%, rgba(201, 168, 76, 0.05) 100%)",
            border: "1px solid rgba(201, 168, 76, 0.2)",
            boxShadow: "0 8px 32px rgba(201, 168, 76, 0.1)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#C9A84C"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="2" y1="2" x2="22" y2="22" />
            <path d="M8.5 16.5a5 5 0 0 1 7 0" />
            <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
            <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
            <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68" />
            <path d="M5 12.55a10 10 0 0 1 5.17-2.39" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <h1
        className="text-2xl font-bold mb-3 text-center"
        style={{
          color: "#FFFFFF",
          fontFamily: "'Playfair Display', serif",
          letterSpacing: "-0.02em",
        }}
      >
        You&apos;re Offline
      </h1>

      {/* Description */}
      <p
        className="text-center mb-10 max-w-xs leading-relaxed"
        style={{
          color: "rgba(255, 255, 255, 0.45)",
          fontSize: "14px",
          lineHeight: "1.6",
        }}
      >
        Please check your internet connection and try again. Kamma Voice requires an active network to deliver live content.
      </p>

      {/* Retry button */}
      <button
        onClick={handleRetry}
        disabled={retrying}
        className="relative overflow-hidden px-8 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-70"
        style={{
          background: retrying
            ? "rgba(201, 168, 76, 0.15)"
            : "linear-gradient(135deg, #C9A84C 0%, #B8973F 100%)",
          color: retrying ? "#C9A84C" : "#0A0A0A",
          border: retrying ? "1px solid rgba(201, 168, 76, 0.3)" : "none",
          boxShadow: retrying ? "none" : "0 4px 24px rgba(201, 168, 76, 0.3)",
          minWidth: "180px",
        }}
      >
        {retrying ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
            </svg>
            Reconnecting...
          </span>
        ) : (
          "Try Again"
        )}
      </button>

      {/* Bottom branding */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center"
        style={{ color: "rgba(255, 255, 255, 0.15)", fontSize: "11px", fontWeight: 600 }}
      >
        Kamma Voice — AI-Powered Media Platform
      </div>
    </div>
  );
}
