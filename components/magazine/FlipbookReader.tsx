"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  forwardRef,
} from "react";
import HTMLFlipBook from "react-pageflip";
import { pdfjs } from "react-pdf";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  ArrowLeft,
  BookOpen,
  Loader2,
} from "lucide-react";
import Link from "next/link";

// ─── PDF.js Worker ─────────────────────────────────────────────────
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ─── Constants ─────────────────────────────────────────────────────
const LOW_RES_SCALE = 0.5; // Preview quality
const HIGH_RES_SCALE_DESKTOP = 1.5;
const HIGH_RES_SCALE_MOBILE = 1.2;
const INITIAL_BATCH = 6; // Pages to render before showing the book
const RENDER_BATCH = 4; // Pages per background batch
const NEARBY_RANGE = 4; // Keep ±4 pages loaded on mobile
const MAX_PAGES_LOADED = 40; // Hard cap for memory safety

// ─── Helpers ───────────────────────────────────────────────────────
const scheduleIdle =
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? (window as any).requestIdleCallback
    : (cb: () => void) => setTimeout(cb, 1);

const cancelIdle =
  typeof window !== "undefined" && "cancelIdleCallback" in window
    ? (window as any).cancelIdleCallback
    : clearTimeout;

/**
 * Normalize Cloudinary PDF URLs.
 * PDFs uploaded with resourceType "auto" or "image" get a /image/upload/ URL
 * which triggers Cloudinary's strict PDF delivery restriction (401).
 * Convert to /raw/upload/ which bypasses this restriction.
 */
function normalizePdfUrl(pdfUrl: string): string {
  if (pdfUrl.includes("res.cloudinary.com") && pdfUrl.endsWith(".pdf")) {
    return pdfUrl.replace("/image/upload/", "/raw/upload/");
  }
  return pdfUrl;
}

/** Render a single PDF page to a canvas, return object URL */
async function renderPageToBlob(
  pdfDoc: any,
  pageNum: number,
  scale: number,
  signal?: AbortSignal
): Promise<string | null> {
  if (signal?.aborted) return null;

  const page = await pdfDoc.getPage(pageNum);
  if (signal?.aborted) {
    page.cleanup();
    return null;
  }

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;

  await page.render({ canvasContext: ctx, viewport }).promise;
  page.cleanup();

  if (signal?.aborted) return null;

  return new Promise<string | null>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob && !signal?.aborted) {
          resolve(URL.createObjectURL(blob));
        } else {
          resolve(null);
        }
      },
      "image/webp",
      0.85
    );
  });
}

// ─── Page Component (forwarded ref required by react-pageflip) ─────
interface FlipPageProps {
  src: string | null;
  highResSrc: string | null;
  pageNumber: number;
  totalPages: number;
  isMobile: boolean;
}

const FlipPage = forwardRef<HTMLDivElement, FlipPageProps>(
  ({ src, highResSrc, pageNumber, totalPages, isMobile }, ref) => {
    const displaySrc = highResSrc || src;

    return (
      <div
        ref={ref}
        className="flipbook-page"
        data-density={pageNumber === 1 || pageNumber === totalPages ? "hard" : "soft"}
      >
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={`Page ${pageNumber}`}
            className="w-full h-full object-contain"
            draggable={false}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#151515]">
            <div className="w-8 h-8 rounded-full border-2 border-gold/30 border-t-gold animate-spin mb-3" />
            <span className="text-xs text-[#555] font-medium">
              Page {pageNumber}
            </span>
          </div>
        )}
      </div>
    );
  }
);
FlipPage.displayName = "FlipPage";

// ─── Main Component ────────────────────────────────────────────────
interface FlipbookReaderProps {
  url: string;
  title: string;
}

export default function FlipbookReader({ url, title }: FlipbookReaderProps) {
  // ── State ──
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  // Page image stores: low-res previews and high-res finals
  const [lowResPages, setLowResPages] = useState<(string | null)[]>([]);
  const [highResPages, setHighResPages] = useState<(string | null)[]>([]);

  // ── Refs ──
  const flipBookRef = useRef<any>(null);
  const pdfDocRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);
  const idleIdsRef = useRef<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  // ── Responsive detection + ResizeObserver ──
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    
    if (!wrapperRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsMobile(window.innerWidth < 768);
        setContainerSize({
          w: entry.contentRect.width,
          h: entry.contentRect.height,
        });
      }
    });
    
    observer.observe(wrapperRef.current);
    
    return () => observer.disconnect();
  }, []);

  // ── Fullscreen listener ──
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ── Auto-hide controls ──
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 3500);
  }, []);

  useEffect(() => {
    showControls();
    const handleMove = () => showControls();
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchstart", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchstart", handleMove);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [showControls]);

  // ── Track Object URLs for cleanup ──
  const trackUrl = useCallback((url: string | null) => {
    if (url) objectUrlsRef.current.add(url);
    return url;
  }, []);

  const revokeUrl = useCallback((url: string | null) => {
    if (url) {
      URL.revokeObjectURL(url);
      objectUrlsRef.current.delete(url);
    }
  }, []);

  // ── Load PDF and render pages ──
  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    async function loadPdf() {
      try {
        // Try multiple URL variants for Cloudinary PDFs
        const urls = [url];
        // If it's a Cloudinary image URL for a PDF, also try the raw variant
        if (url.includes("res.cloudinary.com") && url.endsWith(".pdf")) {
          if (url.includes("/image/upload/")) {
            urls.unshift(url.replace("/image/upload/", "/raw/upload/"));
          }
        }

        let pdfDoc: any = null;
        let lastError: any = null;

        for (const pdfUrl of urls) {
          try {
            const loadingTask = pdfjs.getDocument({
              url: pdfUrl,
              cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
              cMapPacked: true,
            });
            pdfDoc = await loadingTask.promise;
            break; // Success
          } catch (err) {
            lastError = err;
            continue; // Try next URL
          }
        }

        if (!pdfDoc) {
          throw lastError || new Error("Failed to load PDF");
        }
        if (controller.signal.aborted) return;

        pdfDocRef.current = pdfDoc;
        const total = pdfDoc.numPages;
        setNumPages(total);

        // Initialize page arrays
        const emptyArr = new Array(total).fill(null);
        setLowResPages([...emptyArr]);
        setHighResPages([...emptyArr]);

        // Restore saved page
        const savedPage = localStorage.getItem(`magazine-page-${title}`);
        if (savedPage) {
          const parsed = parseInt(savedPage, 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed < total) {
            setCurrentPage(parsed);
          }
        }

        const isMob = window.innerWidth < 768;
        const highScale = isMob ? HIGH_RES_SCALE_MOBILE : HIGH_RES_SCALE_DESKTOP;

        // Phase 1: Render initial batch at low-res for quick display
        const initialCount = Math.min(INITIAL_BATCH, total);
        for (let i = 1; i <= initialCount; i++) {
          if (controller.signal.aborted) return;
          const blobUrl = await renderPageToBlob(pdfDoc, i, LOW_RES_SCALE, controller.signal);
          trackUrl(blobUrl);
          setLowResPages((prev) => {
            const next = [...prev];
            next[i - 1] = blobUrl;
            return next;
          });
          setLoadProgress(Math.round((i / total) * 100));
        }

        // Show the book now
        setLoading(false);

        // Phase 2: Render all pages at high-res in background
        const renderHighRes = async (startPage: number, endPage: number) => {
          for (let i = startPage; i <= endPage; i++) {
            if (controller.signal.aborted) return;

            await new Promise<void>((resolve) => {
              const id = scheduleIdle(
                async () => {
                  if (controller.signal.aborted) {
                    resolve();
                    return;
                  }

                  // Render low-res first if not done
                  if (i > initialCount) {
                    const lowUrl = await renderPageToBlob(pdfDoc, i, LOW_RES_SCALE, controller.signal);
                    trackUrl(lowUrl);
                    setLowResPages((prev) => {
                      const next = [...prev];
                      next[i - 1] = lowUrl;
                      return next;
                    });
                  }

                  // Render high-res
                  const highUrl = await renderPageToBlob(pdfDoc, i, highScale, controller.signal);
                  trackUrl(highUrl);
                  setHighResPages((prev) => {
                    const next = [...prev];
                    next[i - 1] = highUrl;
                    return next;
                  });

                  setLoadProgress(Math.round((i / total) * 100));
                  resolve();
                },
                { timeout: 2000 }
              );
              idleIdsRef.current.push(id);
            });
          }
        };

        // Start rendering from the current page outward for best UX
        const savedIdx = savedPage ? parseInt(savedPage, 10) : 0;
        const startFrom = Math.max(1, savedIdx + 1);

        // Render pages near current position first
        const nearStart = Math.max(1, startFrom - NEARBY_RANGE);
        const nearEnd = Math.min(total, startFrom + NEARBY_RANGE);
        await renderHighRes(nearStart, nearEnd);

        // Then render remaining pages
        if (nearStart > 1) await renderHighRes(1, nearStart - 1);
        if (nearEnd < total) await renderHighRes(nearEnd + 1, total);

      } catch (err: any) {
        if (!controller.signal.aborted) {
          console.error("PDF Load Error:", err);
          const message = err?.message || "Failed to load magazine";
          if (message.includes("401") || message.includes("Unexpected server response")) {
            setLoadError("This magazine PDF is temporarily unavailable. Please try re-uploading it from the admin panel.");
          } else {
            setLoadError(message);
          }
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      controller.abort();
      idleIdsRef.current.forEach((id) => cancelIdle(id));
      idleIdsRef.current = [];
      // Revoke all object URLs on unmount
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    };
  }, [url, title, trackUrl]);

  // ── Memory management: unload distant pages on mobile ──
  useEffect(() => {
    if (!isMobile || numPages <= MAX_PAGES_LOADED) return;

    setHighResPages((prev) => {
      const next = [...prev];
      for (let i = 0; i < next.length; i++) {
        const distance = Math.abs(i - currentPage);
        if (distance > NEARBY_RANGE && next[i]) {
          revokeUrl(next[i]);
          next[i] = null;
        }
      }
      return next;
    });
  }, [currentPage, isMobile, numPages, revokeUrl]);

  // ── Page flip handler ──
  const handleFlip = useCallback(
    (e: any) => {
      const page = e.data;
      setCurrentPage(page);
      localStorage.setItem(`magazine-page-${title}`, page.toString());
      showControls();
    },
    [title, showControls]
  );

  // ── Navigation ──
  const flipPrev = useCallback(() => {
    flipBookRef.current?.pageFlip()?.flipPrev();
  }, []);

  const flipNext = useCallback(() => {
    flipBookRef.current?.pageFlip()?.flipNext();
  }, []);

  // ── Keyboard ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          flipPrev();
          break;
        case "ArrowRight":
        case " ":
          e.preventDefault();
          flipNext();
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "Escape":
          if (isFullscreen) {
            document.exitFullscreen?.();
          }
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flipPrev, flipNext, isFullscreen]);

  // ── Fullscreen ──
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // ── Mobile tap zones ──
  const handleTapZone = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isMobile) return;

      const target = e.target as HTMLElement;
      // Don't interfere with button clicks
      if (target.closest("button") || target.closest("a")) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clientX =
        "touches" in e ? e.changedTouches[0]?.clientX : e.clientX;
      const relativeX = (clientX - rect.left) / rect.width;

      if (relativeX < 0.3) {
        flipPrev();
      } else if (relativeX > 0.7) {
        flipNext();
      } else {
        // Middle zone: toggle controls
        setControlsVisible((v) => !v);
      }
    },
    [isMobile, flipPrev, flipNext]
  );

  // ── Computed dimensions — fit-to-viewport with aspect ratio preservation ──
  const bookDimensions = useMemo(() => {
    if (containerSize.w === 0 || containerSize.h === 0) return { width: 400, height: 560 };

    const { w: availW, h: availH } = containerSize;
    const PAGE_RATIO = 1.414; // A4-ish aspect ratio (height/width)

    if (isMobile) {
      // Single page: fit within available area
      const fitByWidth = availW;
      const fitByHeight = availH / PAGE_RATIO;
      const pageW = Math.min(fitByWidth, fitByHeight);
      return { width: Math.round(pageW), height: Math.round(pageW * PAGE_RATIO) };
    }

    // Desktop dual-page: the book shows 2 pages side-by-side
    // Total book width = 2 * pageW, book height = pageH
    const fitByHeight = availH;
    const pageHFromHeight = fitByHeight;
    const pageWFromHeight = pageHFromHeight / PAGE_RATIO;
    const totalBookWFromHeight = pageWFromHeight * 2;

    const fitByWidth = availW;
    const pageWFromWidth = fitByWidth / 2;
    const pageHFromWidth = pageWFromWidth * PAGE_RATIO;

    // Pick whichever fits within viewport
    let pageW: number, pageH: number;
    if (totalBookWFromHeight <= availW) {
      // Height is the constraint
      pageW = pageWFromHeight;
      pageH = pageHFromHeight;
    } else {
      // Width is the constraint
      pageW = pageWFromWidth;
      pageH = pageHFromWidth;
    }

    return { width: Math.round(pageW), height: Math.round(pageH) };
  }, [isMobile, containerSize]);

  // ── Display page indicator ──
  const pageDisplay = useMemo(() => {
    if (numPages === 0) return "Loading...";
    if (isMobile) return `${currentPage + 1} / ${numPages}`;
    // Desktop dual-page
    const left = currentPage + 1;
    const right = Math.min(currentPage + 2, numPages);
    return left === right ? `${left} / ${numPages}` : `${left}–${right} / ${numPages}`;
  }, [currentPage, numPages, isMobile]);

  // ── Error screen ──
  if (loadError) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
        <BookOpen className="w-16 h-16 text-red-400/30 mb-6" />
        <h2 className="font-[family-name:var(--font-playfair)] text-xl text-white mb-3 text-center">
          Unable to Load Magazine
        </h2>
        <p className="text-sm text-[#888] mb-8 max-w-md text-center leading-relaxed">
          {loadError}
        </p>
        <Link
          href="/magazine"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-[#0A0A0A] font-semibold text-sm hover:bg-gold-light transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Archive
        </Link>
      </div>
    );
  }

  // ── Loading screen ──
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0A]">
        {/* Animated book icon */}
        <div className="relative mb-8">
          <BookOpen className="w-16 h-16 text-gold/20" />
          <BookOpen className="w-16 h-16 text-gold absolute inset-0 animate-pulse" />
        </div>

        <h2 className="font-[family-name:var(--font-playfair)] text-xl text-white mb-2">
          {title}
        </h2>
        <p className="text-sm text-[#666] mb-6">Preparing your reading experience...</p>

        {/* Progress bar */}
        <div className="w-64 h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold-dark via-gold to-gold-light rounded-full transition-all duration-300"
            style={{ width: `${loadProgress}%` }}
          />
        </div>
        <span className="text-xs text-[#555] mt-2 tabular-nums">{loadProgress}%</span>
      </div>
    );
  }

  // ── Main Reader ──
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-40 flex flex-col bg-[#0A0A0A] select-none"
      onClick={handleTapZone}
    >
      {/* ── Top Bar ── */}
      <div
        className={`absolute top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 sm:px-6 transition-all duration-500 ${
          controlsVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-full pointer-events-none"
        }`}
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)",
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/magazine"
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white hover:text-gold transition-all backdrop-blur-sm"
            title="Back to Archive"
            onClick={(e) => e.stopPropagation()}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-[family-name:var(--font-playfair)] text-sm sm:text-base text-gold font-semibold truncate max-w-[180px] sm:max-w-md">
            {title}
          </h1>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFullscreen();
          }}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white hover:text-gold transition-all backdrop-blur-sm hidden sm:flex"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize className="w-4 h-4" />
          ) : (
            <Maximize className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* ── Flipbook Area ── */}
      <div 
        ref={wrapperRef} 
        className="flex-1 flex items-center justify-center overflow-hidden relative w-full"
        style={{ 
          paddingTop: isFullscreen ? 16 : 32, 
          paddingBottom: isMobile ? 80 : 100,
          paddingLeft: isMobile ? 8 : 80,
          paddingRight: isMobile ? 8 : 80,
        }}
      >
        {/* Desktop side navigation zones */}
        {!isMobile && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                flipPrev();
              }}
              disabled={currentPage <= 0}
              className="absolute left-4 z-30 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white/60 hover:text-gold transition-all disabled:opacity-0 disabled:pointer-events-none backdrop-blur-sm cursor-pointer"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                flipNext();
              }}
              disabled={currentPage >= numPages - 1}
              className="absolute right-4 z-30 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white/60 hover:text-gold transition-all disabled:opacity-0 disabled:pointer-events-none backdrop-blur-sm cursor-pointer"
              aria-label="Next Page"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* @ts-ignore — react-pageflip types are incomplete */}
        <HTMLFlipBook
          ref={flipBookRef}
          width={bookDimensions.width}
          height={bookDimensions.height}
          size="fixed"
          showCover={true}
          drawShadow={true}
          flippingTime={600}
          usePortrait={isMobile}
          startPage={currentPage}
          maxShadowOpacity={0.35}
          mobileScrollSupport={false}
          clickEventForward={false}
          swipeDistance={30}
          showPageCorners={!isMobile}
          onFlip={handleFlip}
          className="flipbook-container"
          style={{}}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <FlipPage
              key={i}
              src={lowResPages[i]}
              highResSrc={highResPages[i]}
              pageNumber={i + 1}
              totalPages={numPages}
              isMobile={isMobile}
            />
          ))}
        </HTMLFlipBook>
      </div>

      {/* ── Bottom Controls ── */}
      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
          controlsVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-4 sm:gap-6 px-5 sm:px-6 py-2.5 rounded-full bg-[#111]/80 backdrop-blur-xl border border-white/[0.06] shadow-2xl">
          {/* Prev */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              flipPrev();
            }}
            disabled={currentPage <= 0}
            className="p-2 rounded-full hover:bg-gold/15 text-white hover:text-gold transition-all disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-white cursor-pointer"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Page indicator */}
          <div className="text-sm font-medium tabular-nums min-w-[70px] text-center text-white/80">
            {pageDisplay}
          </div>

          {/* Next */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              flipNext();
            }}
            disabled={currentPage >= numPages - 1}
            className="p-2 rounded-full hover:bg-gold/15 text-white hover:text-gold transition-all disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-white cursor-pointer"
            aria-label="Next Page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Background render progress */}
        {loadProgress < 100 && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <Loader2 className="w-3 h-3 text-gold/40 animate-spin" />
            <span className="text-[10px] text-[#555] tabular-nums">
              Rendering pages... {loadProgress}%
            </span>
          </div>
        )}
      </div>

      {/* ── Flipbook Styles ── */}
      <style jsx global>{`
        .flipbook-container {
          margin: auto;
        }

        /* Ensure the stf parent never overflows the viewport */
        .stf__parent {
          perspective: 2400px;
          max-width: 100vw !important;
          max-height: 100vh !important;
          overflow: visible !important;
        }

        .stf__wrapper {
          overflow: visible !important;
        }

        .flipbook-page {
          background: #f8f6f0;
          overflow: hidden;
        }

        .flipbook-page img {
          pointer-events: none;
          user-select: none;
          -webkit-user-drag: none;
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        /* Hard cover pages */
        .flipbook-page[data-density="hard"] {
          background: #1a1815;
        }

        /* Hide default page corner hint on mobile */
        @media (max-width: 767px) {
          .stf__corner {
            display: none !important;
          }
        }

        /* Elegant drop shadow on the book */
        .stf__parent .stf__wrapper {
          filter: drop-shadow(0 16px 32px rgba(0, 0, 0, 0.5))
                  drop-shadow(0 6px 12px rgba(0, 0, 0, 0.35));
        }
      `}</style>
    </div>
  );
}
