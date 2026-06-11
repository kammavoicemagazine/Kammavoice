"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, BookOpen, HardDrive, Play, Pause, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { 
  getOfflineMagazines, 
  deleteOfflineMagazine, 
  getLocalPdfUrl, 
  getLocalCoverUrl,
  pauseDownload,
  cancelDownload,
  downloadMagazineOffline
} from "@/lib/offline-magazine";
import { useUIStore, OfflineMagazineMetadata, DownloadState } from "@/lib/store/ui-store";
import { triggerLightTap, triggerSuccessHaptic } from "@/lib/haptic-utils";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { DownloadCardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { motionSprings, pressTap } from "@/lib/motion";

// Dynamically import FlipbookReader for offline inline rendering
const FlipbookReader = dynamic(
  () => import("@/components/magazine/FlipbookReader"),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0A0A0A]">
        <BookOpen className="w-12 h-12 text-gold animate-pulse mb-4" />
        <p className="font-[family-name:var(--font-playfair)] text-lg text-white mb-2">
          Initializing Offline Reader...
        </p>
        <Skeleton className="w-32 h-1.5 rounded-full mt-2" variant="gold" />
      </div>
    ),
  }
);

export default function DownloadsPage() {
  const router = useRouter();
  const downloadedMagazines = useUIStore((state) => state.downloadedMagazines);
  const setDownloadedMagazines = useUIStore((state) => state.setDownloadedMagazines);
  const activeDownloads = useUIStore((state) => state.downloads);

  const [activeOfflineReader, setActiveOfflineReader] = useState<{
    url: string;
    title: string;
    id: string;
  } | null>(null);
  
  const [loadingPdf, setLoadingPdf] = useState(false);

  useEffect(() => {
    // Refresh offline magazine metadata list on mount
    setDownloadedMagazines(getOfflineMagazines());
  }, [setDownloadedMagazines]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    triggerLightTap();
    if (confirm("Are you sure you want to delete this downloaded issue?")) {
      await deleteOfflineMagazine(id);
      setDownloadedMagazines(getOfflineMagazines());
    }
  };

  const handlePurgeAll = async () => {
    triggerLightTap();
    if (confirm("Are you sure you want to delete all offline magazines? This action cannot be undone.")) {
      setLoadingPdf(true);
      try {
        const magazinesToPurge = [...downloadedMagazines];
        for (const mag of magazinesToPurge) {
          await deleteOfflineMagazine(mag.id);
        }
        setDownloadedMagazines([]);
        triggerSuccessHaptic();
        alert("All offline cache cleared successfully!");
      } catch (err) {
        console.error("[Downloads] Failed to purge cache:", err);
      } finally {
        setLoadingPdf(false);
      }
    }
  };

  const handleReadOffline = async (mag: OfflineMagazineMetadata) => {
    triggerLightTap();
    setLoadingPdf(true);
    try {
      const localUrl = await getLocalPdfUrl(mag);
      setActiveOfflineReader({
        url: localUrl,
        title: mag.title,
        id: mag.id,
      });
      triggerSuccessHaptic();
    } catch (err) {
      console.error("[OfflineReader] Error loading PDF:", err);
      alert("Failed to load local PDF file.");
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleResume = (d: DownloadState) => {
    triggerLightTap();
    // Re-trigger download offline: the downloader checks stat size and resumes automatically!
    const magMeta: OfflineMagazineMetadata = downloadedMagazines.find(m => m.id === d.magazineId) || {
      id: d.magazineId,
      title: d.title,
      pdfUrl: "",
      coverImageUrl: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80",
      volume: "1",
      issueDate: "Unknown"
    };

    downloadMagazineOffline(
      d.magazineId,
      magMeta.pdfUrl || "",
      d.title,
      magMeta.coverImageUrl,
      magMeta.volume,
      magMeta.issueDate
    );
  };

  // Format bytes for display
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0.0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Convert current downloads to list
  const activeDownloadsList = Object.values(activeDownloads).filter(
    (d) => d.status === "downloading" || d.status === "paused" || d.status === "failed"
  );

  // Calculate storage stats
  const totalMagazinesSize = downloadedMagazines.reduce((acc, curr) => {
    if (!curr.fileSize) return acc;
    const match = curr.fileSize.match(/([0-9.]+)\s*(MB|KB)/i);
    if (!match) return acc;
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    const bytes = unit === "MB" ? value * 1024 * 1024 : value * 1024;
    return acc + bytes;
  }, 0);

  const totalUsedMb = (totalMagazinesSize / (1024 * 1024)).toFixed(1);
  const percentUsed = Math.min(100, Math.max(1, (parseFloat(totalUsedMb) / 500) * 100)); // Out of 500MB budget limit

  if (activeOfflineReader) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0A0A0A]">
        {/* Immersive Overlay Reader Close Button */}
        <button
          onClick={() => {
            triggerLightTap();
            setActiveOfflineReader(null);
          }}
          className="fixed top-4 left-4 z-[10000] p-2.5 rounded-2xl bg-black/60 hover:bg-black/80 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-xs font-bold ml-1.5 pr-1">Exit Reader</span>
        </button>

        <FlipbookReader
          url={activeOfflineReader.url}
          title={activeOfflineReader.title}
          magazineId={activeOfflineReader.id}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA] flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0A0A0A]/85 backdrop-blur-md border-b border-white/[0.06] h-16 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => {
              triggerLightTap();
              router.push("/");
            }}
            whileTap={pressTap}
            className="relative p-2 rounded-xl bg-white/5 border border-white/[0.08] hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer ripple-touch"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <h1 className="text-lg font-bold font-[family-name:var(--font-playfair)] text-white tracking-wide">
            Downloads
          </h1>
        </div>
      </header>

      <div className="h-16" />

      {/* Main content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
        {/* Storage Health Indicator Card */}
        <div className="bg-[#141414] border border-white/[0.06] rounded-2xl p-5 shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">App Cache Management</h3>
                <p className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">
                  Device Storage
                </p>
              </div>
            </div>
            {downloadedMagazines.length > 0 && (
              <motion.button
                onClick={handlePurgeAll}
                whileTap={pressTap}
                className="relative px-3.5 py-1.5 text-[10px] font-extrabold tracking-wider uppercase rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/15 hover:border-red-500/50 text-red-400 transition-all flex items-center gap-1.5 cursor-pointer ripple-touch"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Purge Cache
              </motion.button>
            )}
          </div>

          {/* Low Storage Warning Banner */}
          {totalMagazinesSize >= 450 * 1024 * 1024 && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3 shadow-md">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400 animate-pulse" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Caution: Low Quota Space</h4>
                <p className="text-[11px] text-red-400/80 mt-1 leading-relaxed">
                  You have consumed {totalUsedMb} MB of the 500 MB app limit. Purge older cache segments to avoid write failures.
                </p>
              </div>
            </div>
          )}

          <div>
            <div className="w-full bg-white/[0.03] h-3.5 rounded-full border border-white/[0.05] p-[2px] overflow-hidden mb-3.5">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: percentUsed / 100 }}
                transition={motionSprings.soft}
                className="h-full origin-left bg-gradient-to-r from-[#8E702A] via-[#C9A84C] to-[#E2C779] rounded-full progress-gold"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-gold inline-block" />
                {totalUsedMb} MB used by magazines
              </span>
              <span>Allocated: 500 MB</span>
            </div>
          </div>
        </div>

        {/* Active downloads section */}
        {activeDownloadsList.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-gold uppercase tracking-wider pl-1">
              Active Tasks ({activeDownloadsList.length})
            </h2>
            <div className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {activeDownloadsList.map((d) => (
                  <motion.div 
                    key={d.magazineId}
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={motionSprings.soft}
                    layout
                    className="bg-[#141414] border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-3 overflow-hidden hw-accelerated"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-sm truncate">{d.title}</h3>
                        <p className="text-[10px] text-gray-500 font-semibold uppercase mt-0.5 tracking-wider">
                          {d.status === "downloading" ? "Downloading..." : d.status === "paused" ? "Paused" : "Failed"}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {d.status === "downloading" ? (
                          <motion.button
                            onClick={() => pauseDownload(d.magazineId)}
                            whileTap={pressTap}
                            className="relative p-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer ripple-touch"
                          >
                            <Pause className="w-4 h-4" />
                          </motion.button>
                        ) : (
                          <motion.button
                            onClick={() => handleResume(d)}
                            whileTap={pressTap}
                            className="relative p-2 rounded-lg bg-gold/10 border border-gold/20 text-gold hover:text-white transition-all cursor-pointer ripple-touch"
                          >
                            <Play className="w-4 h-4" />
                          </motion.button>
                        )}

                        <motion.button
                          onClick={() => cancelDownload(d.magazineId)}
                          whileTap={pressTap}
                          className="relative p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 transition-all cursor-pointer ripple-touch"
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Progress info */}
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <motion.div 
                        className={`h-full rounded-full origin-left ${
                          d.status === "paused" 
                            ? "bg-gray-500" 
                            : d.status === "failed" 
                            ? "bg-red-500" 
                            : "bg-gradient-to-r from-gold-dark to-gold progress-gold"
                        }`}
                        style={{ scaleX: Math.max(0, Math.min(100, d.progress)) / 100 }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400">
                      <span>{formatSize(d.downloadedBytes)} / {formatSize(d.totalBytes)}</span>
                      <span className="tabular-nums">{Math.round(d.progress)}%</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Magazine Grid */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-bold text-gold uppercase tracking-wider pl-1">
            Downloaded Editions ({downloadedMagazines.length})
          </h2>

          {downloadedMagazines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01] px-6">
              <BookOpen className="w-12 h-12 text-white/10 mb-4 animate-pulse" />
              <h3 className="text-base font-bold text-white mb-1">
                No offline issues found
              </h3>
              <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                Downloaded magazines will appear here. Tap the download icon on any magazine to read it offline.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {downloadedMagazines.map((mag) => {
                  const isRecentlyDownloaded = mag.downloadedAt 
                    ? (Date.now() - new Date(mag.downloadedAt).getTime() < 15000) 
                    : false;
                  
                  return (
                    <motion.div
                      key={mag.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, x: -30 }}
                      transition={motionSprings.soft}
                      layout
                      onClick={() => handleReadOffline(mag)}
                      className={`flex items-center gap-4 bg-[#141414] hover:bg-white/[0.02] border border-white/[0.06] hover:border-gold/20 rounded-2xl p-3.5 transition-all duration-300 cursor-pointer group shadow-sm overflow-hidden ${
                        isRecentlyDownloaded ? "animate-border-pulse" : ""
                      }`}
                    >
                      {/* Cover Thumb */}
                      <div className="relative w-16 h-20 bg-black rounded-lg overflow-hidden border border-white/10 shrink-0 shadow-md">
                        <img
                          src={getLocalCoverUrl(mag)}
                          alt={mag.title}
                          className="object-cover w-full h-full"
                        />
                      </div>

                      {/* Info details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-sm sm:text-base leading-snug group-hover:text-gold transition-colors truncate">
                            {mag.title}
                          </h3>
                          {isRecentlyDownloaded && (
                            <span className="inline-flex items-center gap-1 bg-gold/15 text-gold text-[7px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-gold/20 tracking-wider">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 font-semibold">
                          Vol. {mag.volume} — {mag.issueDate}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-gray-400 font-bold tabular-nums">
                            {mag.fileSize || "Unknown"}
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium">
                            Downloaded {new Date(mag.downloadedAt || "").toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Action delete */}
                      <motion.button
                        onClick={(e) => handleDelete(e, mag.id)}
                        whileTap={pressTap}
                        className="relative p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 hover:border-red-500/40 text-red-400 transition-all cursor-pointer ripple-touch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Loading Overlay */}
      {loadingPdf && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center px-8"
        >
          <DownloadCardSkeleton />
          <p className="text-sm font-semibold text-gray-300">
            Decoding document...
          </p>
        </motion.div>
      )}

      <style jsx global>{`
        @keyframes borderGlowPulse {
          0% { border-color: rgba(201, 168, 76, 0.2); box-shadow: 0 0 0 rgba(201, 168, 76, 0); }
          50% { border-color: rgba(201, 168, 76, 0.8); box-shadow: 0 0 15px rgba(201, 168, 76, 0.2); }
          100% { border-color: rgba(255, 255, 255, 0.06); box-shadow: 0 0 0 rgba(201, 168, 76, 0); }
        }
        .animate-border-pulse {
          animation: borderGlowPulse 2.5s ease-out 1;
        }
      `}</style>
    </div>
  );
}
