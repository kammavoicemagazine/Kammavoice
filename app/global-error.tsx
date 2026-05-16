"use client";

import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <html lang="te">
      <body>
        <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA] flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-8 bg-surface border border-border-subtle rounded-2xl p-8 shadow-2xl">
            <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-danger" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold font-[family-name:var(--font-playfair)]">
                Critical Error
              </h1>
              <p className="text-muted">
                We're sorry, but an unexpected critical error occurred while rendering this page. Our team has been notified.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => reset()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gold text-[#0A0A0A] font-bold rounded-lg hover:bg-gold-light transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
              
              <Link
                href="/"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-surface-light border border-border-subtle text-white font-bold rounded-lg hover:bg-surface transition-all"
              >
                <Home className="w-5 h-5" />
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
