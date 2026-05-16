"use client";

import { BREAKING_NEWS } from "@/lib/mock-data";

export default function BreakingNewsTicker() {
  // Duplicate items so the ticker loops seamlessly
  const items = [...BREAKING_NEWS, ...BREAKING_NEWS];

  return (
    <div className="bg-surface border-y border-border-subtle overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center">
        {/* Label */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gold/10 border-r border-border-subtle shrink-0">
          <span className="w-2 h-2 rounded-full bg-red-500 pulse-dot" />
          <span className="text-xs font-bold text-gold uppercase tracking-wider whitespace-nowrap">
            Breaking
          </span>
        </div>

        {/* Scrolling Headlines */}
        <div className="overflow-hidden flex-1">
          <div className="ticker-animate flex items-center whitespace-nowrap">
            {items.map((item, i) => (
              <span
                key={`${item.id}-${i}`}
                className="inline-flex items-center px-6 py-2.5 text-sm text-[#CCCCCC] hover:text-gold transition-colors cursor-pointer"
              >
                <span className="w-1 h-1 rounded-full bg-gold/60 mr-4 shrink-0" />
                {item.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
