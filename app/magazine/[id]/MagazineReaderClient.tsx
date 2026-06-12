"use client";

import { useEffect } from "react";
import { BookOpen } from "lucide-react";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";

const FlipbookReader = dynamic(
  () => import("@/components/magazine/FlipbookReader"),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0A]">
        <div className="relative mb-8">
          <BookOpen className="w-16 h-16 text-gold/20" />
          <BookOpen className="w-16 h-16 text-gold absolute inset-0 animate-pulse" />
        </div>
        <p className="font-[family-name:var(--font-playfair)] text-xl text-white mb-2">
          Loading Magazine Viewer...
        </p>
        <Skeleton className="w-36 h-1.5 rounded-full mt-4" variant="gold" />
      </div>
    ),
  }
);

import { incrementMagazineViewCount } from "@/lib/firestore";
import type { Magazine } from "@/lib/types";

export default function MagazineReaderClient({
  magazine,
}: {
  magazine: Magazine;
}) {
  useEffect(() => {
    if (magazine?.isPublished) {
      incrementMagazineViewCount(magazine.id).catch(() => {});
    }
  }, [magazine]);

  return (
    <ErrorBoundary>
      <FlipbookReader url={magazine.pdfUrl} title={magazine.title} magazineId={magazine.id} />
    </ErrorBoundary>
  );
}
