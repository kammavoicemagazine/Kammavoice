"use client";

import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <h1 className="text-8xl font-bold font-[family-name:var(--font-playfair)] text-gold-gradient">
          404
        </h1>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Page Not Found</h2>
          <p className="text-muted">
            The article, magazine, or page you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="bg-surface border border-border-subtle rounded-xl p-6">
          <p className="text-sm text-muted mb-4">Try searching for something else:</p>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search Kamma Voice..."
              className="w-full pl-11 pr-4 py-3 rounded-lg bg-[#111] border border-border-subtle text-sm focus:border-gold/50 focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gold hover:text-gold-light hover:underline transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Homepage
        </Link>
      </div>
    </div>
  );
}
