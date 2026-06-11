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
  Globe, 
  Languages,
  AlertCircle,
  Volume2,
  VolumeX,
  Split,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getMagazinePageTranslation } from "@/lib/firestore";
import { getTTSProvider } from "@/lib/tts";
import type { MagazinePageTranslation } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

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
            <Skeleton className="w-12 h-1.5 rounded-full mb-3" variant="gold" />
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
  magazineId?: string;
}

const LANGUAGES = [
  { code: "te", name: "Telugu (Original)" },
  { code: "en", name: "English" },
  { code: "kn", name: "Kannada" },
  { code: "ta", name: "Tamil" },
];

export default function FlipbookReader({ url, title, magazineId }: FlipbookReaderProps) {
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

  // ── Translation State ──
  const [selectedLanguage, setSelectedLanguage] = useState<string>("te");
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [translationsCache, setTranslationsCache] = useState<Map<number, MagazinePageTranslation | null>>(new Map());
  const [loadingTranslations, setLoadingTranslations] = useState<{ [page: number]: boolean }>({});
  
  // Future-Ready Toggles
  const [isBilingualMode, setIsBilingualMode] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<{ [page: number]: boolean }>({});

  const toggleAudioNarration = async (pageNum: number, textContent?: string) => {
    if (!textContent) {
      toast.error("No text available for audio narration.");
      return;
    }
    const current = !!isPlayingAudio[pageNum];
    setIsPlayingAudio(prev => ({ ...prev, [pageNum]: !current }));
    if (!current) {
      toast.success(`Playing AI Voice Narration (${selectedLanguage.toUpperCase()}) for Page ${pageNum}`, {
        icon: <Volume2 className="w-4 h-4 text-gold animate-bounce" />,
      });
      try {
        const tts = getTTSProvider("simulation");
        const res = await tts.generateSpeech(textContent, selectedLanguage);
        console.log("[TTS Stream Initialized]:", res);
      } catch (ttsErr) {
        console.error("TTS generation error:", ttsErr);
      }
    } else {
      toast.info(`Stopped audio narration for Page ${pageNum}`);
    }
  };

  // Load saved language preference
  useEffect(() => {
    const savedLang = localStorage.getItem("kammavoice-mag-lang");
    if (savedLang && LANGUAGES.some(l => l.code === savedLang)) {
      setSelectedLanguage(savedLang);
    }
  }, []);

  const handleLanguageChange = (code: string) => {
    setSelectedLanguage(code);
    setIsLangMenuOpen(false);
    localStorage.setItem("kammavoice-mag-lang", code);
  };

  /** Fetch translation for a page if not cached */
  const fetchPageTranslation = useCallback(async (pageNum: number) => {
    if (!magazineId || selectedLanguage === "te") return;
    if (translationsCache.has(pageNum)) return;

    setLoadingTranslations(prev => ({ ...prev, [pageNum]: true }));
    try {
      const data = await getMagazinePageTranslation(magazineId, pageNum);
      setTranslationsCache(prev => {
        const next = new Map(prev);
        next.set(pageNum, data);
        return next;
      });
    } catch (err) {
      console.error(`Failed to fetch translation for page ${pageNum}:`, err);
      setTranslationsCache(prev => {
        const next = new Map(prev);
        next.set(pageNum, null);
        return next;
      });
    } finally {
      setLoadingTranslations(prev => ({ ...prev, [pageNum]: false }));
    }
  }, [magazineId, selectedLanguage, translationsCache]);

  // Trigger translation fetch when page or language changes
  useEffect(() => {
    if (selectedLanguage !== "te" && numPages > 0) {
      const activePageNum = currentPage + 1; // 1-indexed
      fetchPageTranslation(activePageNum);
      if (!isMobile && activePageNum < numPages) {
        fetchPageTranslation(activePageNum + 1); // Right page in spread
      }
      // Prefetch next spread
      if (activePageNum + 2 <= numPages) fetchPageTranslation(activePageNum + 2);
    }
  }, [currentPage, selectedLanguage, numPages, isMobile, fetchPageTranslation]);

  /** Helper to render translation content in the overlay */
  const renderTranslationContent = (pageNum: number) => {
    const isLoading = loadingTranslations[pageNum];
    const trans = translationsCache.get(pageNum);

    if (isLoading) {
      return (
        <div className="space-y-4 py-6 animate-pulse">
          <div className="h-5 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded-lg w-3/4"></div>
          <div className="h-5 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded-lg w-full"></div>
          <div className="h-5 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded-lg w-5/6"></div>
          <div className="h-5 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded-lg w-2/3 pt-6"></div>
          <div className="h-5 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded-lg w-4/5"></div>
        </div>
      );
    }

    if (!trans) {
      return (
        <div className="py-16 text-center text-muted flex flex-col items-center gap-3 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
          <AlertCircle className="w-8 h-8 text-gold/40 animate-pulse" />
          <p className="text-sm font-medium">Translation is currently being generated or unavailable for Page {pageNum}.</p>
          <p className="text-xs text-muted-subtle">Please check back later or view the Telugu original.</p>
        </div>
      );
    }

    if (trans.status === "failed") {
      return (
        <div className="py-16 text-center text-red-400/90 flex flex-col items-center gap-3 border border-dashed border-red-500/20 rounded-2xl bg-red-500/[0.02]">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm font-semibold">AI Translation encountered an error for Page {pageNum}.</p>
          <p className="text-xs text-white/50 max-w-md mx-auto">{trans.errorMessage || "Unable to process OCR content from image."}</p>
          <button
            onClick={() => fetchPageTranslation(pageNum)}
            className="mt-2 px-4 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-white text-xs font-bold transition-all border border-red-500/30 cursor-pointer"
          >
            Retry AI Translation
          </button>
        </div>
      );
    }

    if (trans.originalText?.trim() === "") {
      return (
        <div className="py-20 text-center text-white/40 font-[family-name:var(--font-playfair)] italic flex flex-col items-center gap-2 border border-white/5 rounded-3xl bg-white/[0.02] shadow-inner">
          <p className="text-xl text-gold/60">[ Visual Graphic / Advertisement ]</p>
          <p className="text-xs font-sans text-muted">No editorial text present on this page.</p>
        </div>
      );
    }

    // @ts-ignore
    const textContent = trans.translations?.[selectedLanguage] || trans.originalText;

    if (!textContent) {
      return <p className="py-8 text-muted italic">No content available for this language.</p>;
    }

    return (
      <div className="space-y-6 py-2">
        {/* Audio Narration Bar if active */}
        {isPlayingAudio[pageNum] && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-gold/10 border border-gold/30 text-gold text-xs font-medium animate-pulse">
            <Volume2 className="w-4 h-4 animate-bounce" />
            <span>AI Voice Narration active for Page {pageNum}... (Simulated TTS stream)</span>
          </div>
        )}

        {/* Bilingual Mode Split View */}
        {isBilingualMode ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-white/10">
            <div className="space-y-4 pr-4 border-r border-white/10">
              <div className="text-[10px] font-bold text-gold uppercase tracking-widest border-b border-gold/20 pb-1.5">Telugu Original (OCR)</div>
              {trans.originalText?.split("\n\n").map((para: string, idx: number) => (
                <p key={idx} className="leading-relaxed tracking-wide text-white/70 font-sans text-sm">
                  {para}
                </p>
              ))}
            </div>
            <div className="space-y-4 pl-2">
              <div className="text-[10px] font-bold text-gold uppercase tracking-widest border-b border-gold/20 pb-1.5">{LANGUAGES.find(l => l.code === selectedLanguage)?.name}</div>
              {textContent.split("\n\n").map((para: string, idx: number) => (
                <p key={idx} className="leading-loose tracking-wide text-white/95 font-sans text-base border-l-2 border-gold/40 pl-4 py-0.5 bg-white/[0.01] rounded-r-xl shadow-sm">
                  {para}
                </p>
              ))}
            </div>
          </div>
        ) : (
          /* Standard Single Language View */
          textContent.split("\n\n").map((para: string, idx: number) => (
            <p key={idx} className="leading-loose tracking-wide text-white/95 font-sans text-base sm:text-lg border-l-2 border-gold/40 pl-4 sm:pl-5 py-1 bg-white/[0.01] rounded-r-xl shadow-sm">
              {para}
            </p>
          ))
        )}
      </div>
    );
  };

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
            className="h-full origin-left bg-gradient-to-r from-gold-dark via-gold to-gold-light rounded-full transition-transform duration-300 progress-gold"
            style={{ transform: `scaleX(${loadProgress / 100})` }}
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

        <div className="flex items-center gap-2 sm:gap-3">
          {/* ── Language Switcher ── */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLangMenuOpen(!isLangMenuOpen);
              }}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-gold transition-all backdrop-blur-md flex items-center gap-2 text-xs sm:text-sm font-medium border border-white/10 cursor-pointer shadow-lg"
              title="Switch Language"
            >
              <Globe className="w-4 h-4 text-gold" />
              <span className="hidden sm:inline">{LANGUAGES.find(l => l.code === selectedLanguage)?.name}</span>
              <span className="sm:hidden">{selectedLanguage.toUpperCase()}</span>
            </button>

            {/* Onboarding Tooltip for first-time switching */}
            {selectedLanguage === "te" && (
              <div className="absolute right-0 top-full mt-3 w-64 p-3 rounded-2xl bg-gold text-black text-xs font-semibold shadow-2xl animate-bounce pointer-events-none z-50 before:absolute before:top-[-6px] before:right-6 before:w-3 before:h-3 before:bg-gold before:rotate-45">
                💡 Tip: Click here to instantly read this magazine in English, Kannada, or Tamil!
              </div>
            )}

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#111]/95 backdrop-blur-3xl border border-white/10 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 py-1.5 border-b border-white/10 mb-1 text-[10px] font-bold text-muted uppercase tracking-wider">
                  Select Reading Language
                </div>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLanguageChange(lang.code);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-xs sm:text-sm font-medium transition-colors flex items-center justify-between cursor-pointer ${
                      selectedLanguage === lang.code
                        ? "bg-gold/20 text-gold font-bold"
                        : "text-white/80 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span>{lang.name}</span>
                    {selectedLanguage === lang.code && <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white hover:text-gold transition-all backdrop-blur-sm hidden sm:flex cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </button>
        </div>
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

        {/* ── Glassmorphic Translation Overlay ── */}
        {selectedLanguage !== "te" && (
          <div 
            className="absolute inset-4 sm:inset-8 md:inset-12 z-40 bg-[#0c0a09]/95 backdrop-blur-2xl border border-gold/40 rounded-3xl p-6 sm:p-10 flex flex-col shadow-[0_0_50px_rgba(212,175,55,0.15)] transition-all duration-500 animate-in fade-in zoom-in-95 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Language Badge + Page Numbers + Close Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6 flex-shrink-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-gold/20 border border-gold/40 text-gold text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <Globe className="w-3.5 h-3.5" /> {LANGUAGES.find(l => l.code === selectedLanguage)?.name} Translation
                </span>
                <span className="text-xs sm:text-sm text-muted font-medium">
                  {isMobile ? `Page ${currentPage + 1}` : `Pages ${currentPage + 1} - ${Math.min(currentPage + 2, numPages)}`}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Bilingual Toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); setIsBilingualMode(!isBilingualMode); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border cursor-pointer ${
                    isBilingualMode 
                      ? "bg-gold/20 text-gold border-gold/40 shadow-sm" 
                      : "bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10"
                  }`}
                  title="Toggle Side-by-Side Bilingual Mode"
                >
                  <Split className="w-3.5 h-3.5" /> Bilingual Mode
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedLanguage("te"); }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white hover:text-gold text-xs font-semibold transition-all flex items-center gap-1 border border-white/10 cursor-pointer shadow-sm"
                >
                  View Original PDF
                </button>
              </div>
            </div>

            {/* Content Area: Split view on Desktop, Single view on Mobile */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col md:flex-row gap-8 md:gap-12 text-white/90 font-[family-name:var(--font-inter)] text-base sm:text-lg leading-relaxed">
              {/* Left / Active Page */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between border-b border-gold/20 pb-2">
                  <h3 className="text-xs font-bold text-gold uppercase tracking-wider">Page {currentPage + 1}</h3>
                  <button
                    onClick={() => {
                      const trans = translationsCache.get(currentPage + 1);
                      // @ts-ignore
                      const text = trans?.translations?.[selectedLanguage] || trans?.originalText;
                      toggleAudioNarration(currentPage + 1, text);
                    }}
                    className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer ${
                      isPlayingAudio[currentPage + 1]
                        ? "bg-gold/20 border-gold/40 text-gold animate-pulse"
                        : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70 hover:text-white"
                    }`}
                    title="AI Voice Narration"
                  >
                    {isPlayingAudio[currentPage + 1] ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{isPlayingAudio[currentPage + 1] ? "Stop Audio" : "Listen"}</span>
                  </button>
                </div>
                {renderTranslationContent(currentPage + 1)}
              </div>

              {/* Right Page (Desktop only) */}
              {!isMobile && currentPage + 1 < numPages && (
                <div className="flex-1 space-y-4 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-12">
                  <div className="flex items-center justify-between border-b border-gold/20 pb-2">
                    <h3 className="text-xs font-bold text-gold uppercase tracking-wider">Page {currentPage + 2}</h3>
                    <button
                      onClick={() => {
                        const trans = translationsCache.get(currentPage + 2);
                        // @ts-ignore
                        const text = trans?.translations?.[selectedLanguage] || trans?.originalText;
                        toggleAudioNarration(currentPage + 2, text);
                      }}
                      className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer ${
                        isPlayingAudio[currentPage + 2]
                          ? "bg-gold/20 border-gold/40 text-gold animate-pulse"
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70 hover:text-white"
                      }`}
                      title="AI Voice Narration"
                    >
                      {isPlayingAudio[currentPage + 2] ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isPlayingAudio[currentPage + 2] ? "Stop Audio" : "Listen"}</span>
                    </button>
                  </div>
                  {renderTranslationContent(currentPage + 2)}
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-6 flex-shrink-0 text-sm">
              <button
                onClick={(e) => { e.stopPropagation(); flipPrev(); }}
                disabled={currentPage <= 0}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white hover:text-gold disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-2 cursor-pointer font-medium border border-white/5 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Page
              </button>
              <div className="text-xs text-muted hidden sm:block font-medium">
                AI Multimodal Translation & Narration powered by Google Gemini
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); flipNext(); }}
                disabled={currentPage >= numPages - 1}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white hover:text-gold disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-2 cursor-pointer font-medium border border-white/5 shadow-sm"
              >
                Next Page <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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
            <Skeleton className="w-3 h-3 rounded-full" variant="gold" />
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
