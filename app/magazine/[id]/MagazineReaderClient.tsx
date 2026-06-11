"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { isMagazineDownloaded, getOfflineMagazines, getLocalPdfUrl, verifyOfflineMagazineExists } from "@/lib/offline-magazine";
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
  const [pdfUrl, setPdfUrl] = useState(magazine.pdfUrl);
  const [isOfflineCopy, setIsOfflineCopy] = useState(false);

  useEffect(() => {
    if (magazine?.isPublished) {
      incrementMagazineViewCount(magazine.id).catch(() => {});
    }
  }, [magazine]);

  useEffect(() => {
    async function resolvePdfSource() {
      if (isMagazineDownloaded(magazine.id)) {
        const exists = await verifyOfflineMagazineExists(magazine.id);
        if (exists) {
          const offlineList = getOfflineMagazines();
          const meta = offlineList.find((m) => m.id === magazine.id);
          if (meta) {
            try {
              const localUrl = await getLocalPdfUrl(meta);
              setPdfUrl(localUrl);
              setIsOfflineCopy(true);
              console.log("[Reader] Swapped to offline source file:", localUrl);
              return;
            } catch (err) {
              console.warn("[Reader] Failed to convert local PDF file, using remote url:", err);
            }
          }
        }
      }
      setPdfUrl(magazine.pdfUrl);
      setIsOfflineCopy(false);
    }
    resolvePdfSource();
  }, [magazine]);

  return (
    <ErrorBoundary>
      <FlipbookReader url={pdfUrl} title={magazine.title} magazineId={magazine.id} />
      {isOfflineCopy && (
        <div className="fixed bottom-20 left-4 z-50 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-extrabold tracking-widest uppercase pointer-events-none shadow-md">
          Available Offline
        </div>
      )}
    </ErrorBoundary>
  );
}
