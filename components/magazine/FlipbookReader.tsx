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
  ArrowLeft,
  BookOpen,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Maximize2,
  Minimize2,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

// ─── PDF.js Worker ─────────────────────────────────────────────────
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ─── Constants ─────────────────────────────────────────────────────
const LOW_RES_SCALE = 0.4; // Thumbnail & background preview quality
const NEARBY_RANGE = 2; // Strict ±2 virtualization page range

// Helper for schedule idle task
const scheduleIdle =
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? (window as any).requestIdleCallback
    : (cb: () => void) => setTimeout(cb, 1);

const cancelIdle =
  typeof window !== "undefined" && "cancelIdleCallback" in window
    ? (window as any).cancelIdleCallback
    : clearTimeout;

/** Render PDF page to a canvas and export as object URL for thumbnail cache */
async function renderPageToBlob(
  pdfDoc: any,
  pageNum: number,
  scale: number,
  signal?: AbortSignal
): Promise<string | null> {
  if (signal?.aborted) return null;

  try {
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
        0.80
      );
    });
  } catch (err) {
    console.error(`Error rendering page ${pageNum}:`, err);
    return null;
  }
}

// ─── Page Component (forwarded ref required by react-pageflip) ─────
interface FlipPageProps {
  pdfDoc: any;
  lowResSrc: string | null;
  pageNumber: number;
  totalPages: number;
  usePortraitMode: boolean;
  isNearby: boolean;
  scale: number;
  zoom: number;
}

const FlipPage = forwardRef<HTMLDivElement, FlipPageProps>(
  ({ pdfDoc, lowResSrc, pageNumber, totalPages, usePortraitMode, isNearby, scale, zoom }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [renderState, setRenderState] = useState<"idle" | "rendering" | "success" | "error">(
      "idle"
    );
    const renderTaskRef = useRef<any>(null);

    // Calculate dynamic rendering scale based on the zoom factor to avoid pixelated text when zoomed in
    const renderScale = useMemo(() => {
      const base = scale;
      // Scale up with zoom, capping at 5.5 to prevent crash in canvas memory allocations
      return Math.min(5.5, base * Math.max(1.0, zoom));
    }, [scale, zoom]);

    // Direct PDF.js canvas rendering with cancellation
    useEffect(() => {
      if (!pdfDoc || !isNearby) {
        setRenderState("idle");
        return;
      }

      let active = true;

      async function renderPage() {
        try {
          setRenderState("rendering");
          const page = await pdfDoc.getPage(pageNumber);
          if (!active) return;

          const canvas = canvasRef.current;
          if (!canvas) return;

          // High DPI viewport setup (e.g. scale * zoom for crisp text)
          const viewport = page.getViewport({ scale: renderScale });
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          // Cancel any active render task before starting a new one
          if (renderTaskRef.current) {
            try {
              renderTaskRef.current.cancel();
            } catch (e) {}
          }

          const renderContext = {
            canvasContext: ctx,
            viewport,
          };

          const task = page.render(renderContext);
          renderTaskRef.current = task;

          await task.promise;
          page.cleanup();

          if (active) {
            setRenderState("success");
          }
        } catch (err: any) {
          if (err?.name !== "RenderingCancelledException" && err?.name !== "WorkerCancelledException") {
            console.error(`[PDF-Render] Error on page ${pageNumber}:`, err);
            if (active) setRenderState("error");
          }
        }
      }

      renderPage();

      return () => {
        active = false;
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch (e) {}
        }
      };
    }, [pdfDoc, pageNumber, isNearby, renderScale]);

    // Show low-res thumbnail image background only if canvas isn't successfully drawn yet
    const showLowRes = !isNearby || renderState !== "success";

    return (
      <div
        ref={ref}
        className="flipbook-page bg-[#faf8f5] flex items-center justify-center overflow-hidden relative w-full h-full"
        style={{
          boxShadow: "inset 0 0 1px rgba(0, 0, 0, 0.15)",
        }}
        data-density={pageNumber === 1 || pageNumber === totalPages ? "hard" : "soft"}
      >
        {/* Crisp vector canvas for nearby pages */}
        {isNearby && (
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 z-10 ${
              renderState === "success" ? "opacity-100" : "opacity-0"
            }`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        )}

        {/* Lightweight low-res background preview image to prevent white flashes */}
        {showLowRes && lowResSrc && (
          <img
            src={lowResSrc}
            alt={`Page ${pageNumber} Preview`}
            className="absolute inset-0 w-full h-full object-contain blur-[1px] opacity-75 pointer-events-none"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
            draggable={false}
          />
        )}

        {/* Loading skeleton wrapper when neither canvas nor thumbnail is ready */}
        {!lowResSrc && renderState !== "success" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111]">
            <Skeleton className="w-12 h-1.5 rounded-full mb-3" variant="gold" />
            <span className="text-[10px] text-gray-500 font-bold font-mono tracking-wider">
              LOADING PAGE {pageNumber}...
            </span>
          </div>
        )}

        {/* Realistic center spine shading and center crease fold lines inside double-spread pages */}
        {!usePortraitMode && pageNumber > 1 && pageNumber < totalPages && (
          <>
            <div
              className="absolute top-0 bottom-0 w-12 pointer-events-none z-20"
              style={{
                background:
                  pageNumber % 2 === 0
                    ? "linear-gradient(to left, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0) 100%)"
                    : "linear-gradient(to right, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0) 100%)",
                right: pageNumber % 2 === 0 ? 0 : "auto",
                left: pageNumber % 2 === 0 ? "auto" : 0,
              }}
            />
            <div
              className="absolute top-0 bottom-0 w-[1px] pointer-events-none z-20 bg-black/25"
              style={{
                right: pageNumber % 2 === 0 ? 0 : "auto",
                left: pageNumber % 2 === 0 ? "auto" : 0,
              }}
            />
            {/* Outer stacked-page depth borders */}
            <div
              className="absolute top-0 bottom-0 w-[2px] pointer-events-none z-20"
              style={{
                left: pageNumber % 2 === 0 ? 0 : "auto",
                right: pageNumber % 2 === 0 ? "auto" : 0,
                background: pageNumber % 2 === 0 
                  ? "linear-gradient(to right, rgba(0,0,0,0.12), rgba(0,0,0,0.02) 80%, rgba(0,0,0,0))"
                  : "linear-gradient(to left, rgba(0,0,0,0.12), rgba(0,0,0,0.02) 80%, rgba(0,0,0,0))",
              }}
            />
          </>
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

export default function FlipbookReader({ url, title }: FlipbookReaderProps) {
  // ── State ──
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [controlsHovered, setControlsHovered] = useState(false);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [pageRatio, setPageRatio] = useState(1.357); // Default aspect ratio (height / width)
  const [usePortraitMode, setUsePortraitMode] = useState(true);

  // Zoom & Sizing Modes (Fit Width is default mode)
  const [zoom, setZoom] = useState(1.0);
  const [debouncedZoom, setDebouncedZoom] = useState(1.0);
  const [fitMode, setFitMode] = useState<"page" | "width">("page");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageInputVal, setPageInputVal] = useState("1");

  // Sync debouncedZoom with 400ms delay to prevent excessive canvas rendering during drag
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedZoom(zoom);
    }, 400);
    return () => clearTimeout(handler);
  }, [zoom]);

  // Page low-res previews store for thumbnails and backgrounds
  const [lowResPages, setLowResPages] = useState<(string | null)[]>([]);

  // ── Refs ──
  const flipBookRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);
  const idleIdsRef = useRef<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  // Track Object URLs for cleanup
  const trackUrl = useCallback((url: string | null) => {
    if (url) objectUrlsRef.current.add(url);
    return url;
  }, []);

  // ── Responsive detection + ResizeObserver ──
  useEffect(() => {
    const checkViewport = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isMob = w < 768;
      setIsMobile(isMob);
      setUsePortraitMode(w < 900 || w < h);

      // Auto close sidebar on mobile initial load
      if (isMob && loading) {
        setSidebarOpen(false);
      }
    };

    checkViewport();

    if (!wrapperRef.current) return;

    let lastW = 0;
    let lastH = 0;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const rectW = entry.contentRect.width;
        const rectH = entry.contentRect.height;

        // On mobile, ignore small height changes (like the URL bar hiding/showing) to prevent shaking
        const isMobileDevice = w < 768;
        const widthChanged = Math.abs(rectW - lastW) > 10;
        const heightChanged = Math.abs(rectH - lastH) > (isMobileDevice ? 100 : 10);

        if (widthChanged || heightChanged) {
          lastW = rectW;
          lastH = rectH;
          setIsMobile(isMobileDevice);
          setUsePortraitMode(w < 900 || w < h);
          setContainerSize({
            w: rectW,
            h: rectH,
          });
        }
      }
    });

    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [loading]);

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
    if (!controlsHovered && !sidebarOpen) {
      controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
    }
  }, [controlsHovered, sidebarOpen]);

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
  }, [showControls, controlsHovered, sidebarOpen]);

  // ── Load PDF and render initial previews ──
  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    async function loadPdf() {
      try {
        const urls = [url];
        if (url.includes("res.cloudinary.com") && url.endsWith(".pdf")) {
          if (url.includes("/image/upload/")) {
            urls.unshift(url.replace("/image/upload/", "/raw/upload/"));
          }
        }

        let loadedDoc: any = null;
        let lastError: any = null;

        for (const pdfUrl of urls) {
          try {
            const loadingTask = pdfjs.getDocument({
              url: pdfUrl,
              cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
              cMapPacked: true,
            });
            loadedDoc = await loadingTask.promise;
            break;
          } catch (err) {
            lastError = err;
          }
        }

        if (!loadedDoc) throw lastError || new Error("Failed to load PDF");
        if (controller.signal.aborted) return;

        setPdfDoc(loadedDoc);
        const total = loadedDoc.numPages;
        setNumPages(total);

        // Dynamic aspect ratio detection from page 2 (inner sheet)
        try {
          const samplePage = await loadedDoc.getPage(total > 1 ? 2 : 1);
          const sampleViewport = samplePage.getViewport({ scale: 1.0 });
          const ratio = sampleViewport.height / sampleViewport.width;
          if (ratio > 0.5 && ratio < 2.5) {
            setPageRatio(ratio);
            console.log("[FlowPaper] Dynamic aspect ratio detected:", ratio);
          }
        } catch (ratioErr) {
          console.warn("[FlowPaper] Aspect ratio detection failed:", ratioErr);
        }

        const emptyArr = new Array(total).fill(null);
        setLowResPages([...emptyArr]);

        // Restore saved page
        const savedPage = localStorage.getItem(`magazine-page-${title}`);
        if (savedPage) {
          const parsed = parseInt(savedPage, 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed < total) {
            setCurrentPage(parsed);
            setPageInputVal((parsed + 1).toString());
          }
        }

        // Phase 1: Render first few pages at low-res for instant previews
        const initialCount = Math.min(6, total);
        for (let i = 1; i <= initialCount; i++) {
          if (controller.signal.aborted) return;
          const blobUrl = await renderPageToBlob(loadedDoc, i, LOW_RES_SCALE, controller.signal);
          trackUrl(blobUrl);
          setLowResPages((prev) => {
            const next = [...prev];
            next[i - 1] = blobUrl;
            return next;
          });
          setLoadProgress(Math.round((i / total) * 100));
        }

        setLoading(false);

        // Render remaining pages in background using idle schedules
        const renderRemainingLowRes = async () => {
          for (let i = initialCount + 1; i <= total; i++) {
            if (controller.signal.aborted) return;
            await new Promise<void>((resolve) => {
              const id = scheduleIdle(async () => {
                if (controller.signal.aborted) {
                  resolve();
                  return;
                }
                const blobUrl = await renderPageToBlob(
                  loadedDoc,
                  i,
                  LOW_RES_SCALE,
                  controller.signal
                );
                trackUrl(blobUrl);
                setLowResPages((prev) => {
                  const next = [...prev];
                  next[i - 1] = blobUrl;
                  return next;
                });
                resolve();
              });
              idleIdsRef.current.push(id);
            });
          }
        };

        renderRemainingLowRes();
      } catch (err: any) {
        if (!controller.signal.aborted) {
          console.error("PDF Loading Exception:", err);
          setLoadError(err?.message || "Failed to parse magazine file.");
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      controller.abort();
      idleIdsRef.current.forEach((id) => cancelIdle(id));
      idleIdsRef.current = [];
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    };
  }, [url, title, trackUrl]);

  // Sync Input Value on page changes
  useEffect(() => {
    setPageInputVal((currentPage + 1).toString());
  }, [currentPage]);

  // ── Professional Zoom Centering adjustment ──
  const changeZoom = useCallback((targetZoom: number) => {
    const nextZoom = Math.max(0.5, Math.min(3.0, targetZoom));
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      setZoom(nextZoom);
      return;
    }

    const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = wrapper;
    const pctX = (scrollLeft + clientWidth / 2) / (scrollWidth || 1);
    const pctY = (scrollTop + clientHeight / 2) / (scrollHeight || 1);

    setZoom(nextZoom);

    // Apply scroll adjustment in the next frame
    requestAnimationFrame(() => {
      if (!wrapperRef.current) return;
      const w = wrapperRef.current;
      w.scrollLeft = pctX * w.scrollWidth - w.clientWidth / 2;
      w.scrollTop = pctY * w.scrollHeight - w.clientHeight / 2;
    });
  }, []);

  // ── Keyboard Navigation ──
  const flipPrev = useCallback(() => {
    flipBookRef.current?.pageFlip()?.flipPrev();
  }, []);

  const flipNext = useCallback(() => {
    flipBookRef.current?.pageFlip()?.flipNext();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;

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
        case "+":
        case "=":
          e.preventDefault();
          changeZoom(zoom + 0.25);
          break;
        case "-":
        case "_":
          e.preventDefault();
          changeZoom(zoom - 0.25);
          break;
        case "0":
          e.preventDefault();
          changeZoom(1.0);
          setFitMode("page");
          break;
        case "Escape":
          if (isFullscreen) {
            document.exitFullscreen?.();
          } else {
            changeZoom(1.0);
          }
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flipPrev, flipNext, isFullscreen, zoom, changeZoom]);

  // ── Mouse Wheel Zoom (Ctrl + Wheel) ──
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.25 : -0.25;
        changeZoom(zoom + delta);
      }
    };

    wrapper.addEventListener("wheel", handleWheel, { passive: false });
    return () => wrapper.removeEventListener("wheel", handleWheel);
  }, [zoom, changeZoom]);

  // ── Page Flip Callback ──
  const handleFlip = useCallback(
    (e: any) => {
      const page = e.data;
      setCurrentPage(page);
      localStorage.setItem(`magazine-page-${title}`, page.toString());
      showControls();
    },
    [title, showControls]
  );

  // ── Tap navigation zones on Mobile ──
  const handleTapZone = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isMobile) return;
      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("a") ||
        target.closest("input") ||
        target.closest(".flipbook-sidebar")
      )
        return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clientX = "touches" in e ? e.changedTouches[0]?.clientX : e.clientX;
      const relativeX = (clientX - rect.left) / rect.width;

      if (relativeX < 0.25) {
        flipPrev();
      } else if (relativeX > 0.75) {
        flipNext();
      } else {
        setControlsVisible((v) => !v);
      }
    },
    [isMobile, flipPrev, flipNext]
  );

  // ── Double Click Zoom ──
  const handleDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("form") ||
      target.closest(".flipbook-sidebar")
    )
      return;

    e.preventDefault();
    if (zoom > 1.0) {
      changeZoom(1.0);
    } else {
      changeZoom(1.8);
    }
  };

  // ── Page Input form ──
  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(pageInputVal, 10);
    if (!isNaN(val) && val >= 1 && val <= numPages) {
      flipBookRef.current?.pageFlip()?.flip(val - 1);
    } else {
      setPageInputVal((currentPage + 1).toString());
    }
  };

  // ── Fullscreen Toggle ──
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // ── Core Sizing Coordinates ──
  const bookDimensions = useMemo(() => {
    const baseWidth = 800; // Static coordinate space
    const baseHeight = Math.round(800 * pageRatio);
    return { width: baseWidth, height: baseHeight };
  }, [pageRatio]);

  // Compute CSS scaling factor (Occupy 94% of workspace viewport on desktop, 96% on mobile)
  const fitScale = useMemo(() => {
    if (containerSize.w === 0 || containerSize.h === 0) return 1.0;

    const marginFactor = isMobile ? 0.96 : 0.94;
    const targetW = containerSize.w * marginFactor;
    const targetH = containerSize.h * marginFactor;
    const bookWidth = bookDimensions.width * (usePortraitMode ? 1 : 2);

    if (fitMode === "width") {
      return targetW / bookWidth;
    } else {
      return Math.min(targetW / bookWidth, targetH / bookDimensions.height);
    }
  }, [containerSize, usePortraitMode, fitMode, bookDimensions, isMobile]);

  // Combined scaling factor
  const finalScale = useMemo(() => fitScale * zoom, [fitScale, zoom]);

  const wrapperWidth = useMemo(
    () => bookDimensions.width * (usePortraitMode ? 1 : 2) * finalScale,
    [bookDimensions, usePortraitMode, finalScale]
  );

  const wrapperHeight = useMemo(
    () => bookDimensions.height * finalScale,
    [bookDimensions, finalScale]
  );

  // Active spread check for virtualization (mounts canvas only within ±2 pages of active viewport)
  const isPageNearby = useCallback(
    (pageNum: number) => {
      const pageIndex = pageNum - 1;
      return Math.abs(pageIndex - currentPage) <= NEARBY_RANGE;
    },
    [currentPage]
  );

  // Display page numbers
  const pageDisplay = useMemo(() => {
    if (numPages === 0) return "Loading...";
    if (usePortraitMode) return `${currentPage + 1} / ${numPages}`;

    const left = currentPage + 1;
    const right = Math.min(currentPage + 2, numPages);
    return left === right ? `${left} / ${numPages}` : `${left}–${right} / ${numPages}`;
  }, [currentPage, numPages, usePortraitMode]);

  // Sidebar thumbnail active highlights
  const isThumbnailActive = useCallback(
    (idx: number) => {
      if (usePortraitMode) return idx === currentPage;
      if (currentPage === 0) return idx === 0;
      return idx === currentPage || idx === currentPage + 1;
    },
    [currentPage, usePortraitMode]
  );

  if (loadError) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
        <BookOpen className="w-16 h-16 text-red-400/30 mb-6 animate-pulse" />
        <h2 className="font-[family-name:var(--font-playfair)] text-xl text-white mb-3 text-center">
          Unable to Load Magazine
        </h2>
        <p className="text-sm text-[#888] mb-8 max-w-md text-center leading-relaxed font-medium">
          {loadError}
        </p>
        <Link
          href="/magazine"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-[#0A0A0A] font-extrabold text-sm hover:bg-gold-light transition-all shadow-lg shadow-gold/15"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" /> Back to Archive
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0A]">
        <div className="relative mb-6">
          <BookOpen className="w-16 h-16 text-gold/20" />
          <BookOpen className="w-16 h-16 text-gold absolute inset-0 animate-pulse" />
        </div>
        <h2 className="font-[family-name:var(--font-playfair)] text-xl text-white mb-1 font-bold">
          {title}
        </h2>
        <p className="text-xs text-gray-500 mb-6 font-semibold uppercase tracking-widest font-mono">
          Preparing High Resolution Spreads...
        </p>

        <div className="w-64 h-1.5 bg-[#161616] border border-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold-dark via-gold to-gold-light rounded-full transition-transform duration-300 progress-gold"
            style={{ transform: `scaleX(${loadProgress / 100})`, transformOrigin: "left" }}
          />
        </div>
        <span className="text-xs font-bold font-mono text-gold mt-2 tabular-nums">{loadProgress}%</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex select-none w-screen h-screen overflow-hidden text-[#FAFAFA]"
      style={{
        backgroundImage: "linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.3)), url('/images/wood-texture.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      onClick={handleTapZone}
      onDoubleClick={handleDoubleClick}
    >
      {/* ── Immersive Viewer Workspace ── */}
      <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-transparent">
        {/* ── 3. Centered Zoom-Scroll Content ── */}
        <div
          ref={wrapperRef}
          className="flex-1 overflow-auto overscroll-none relative bg-transparent w-full h-full"
        >
          {/* Side Nav Buttons (Visible on mobile and desktop) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              flipPrev();
            }}
            disabled={currentPage <= 0}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-35 text-white/50 hover:text-white transition-all disabled:opacity-0 disabled:pointer-events-none cursor-pointer filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] bg-black/20 hover:bg-black/50 rounded-full p-2 sm:p-0 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-8 h-8 sm:w-14 sm:h-14 stroke-[2]" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              flipNext();
            }}
            disabled={currentPage >= numPages - 1}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-35 text-white/50 hover:text-white transition-all disabled:opacity-0 disabled:pointer-events-none cursor-pointer filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] bg-black/20 hover:bg-black/50 rounded-full p-2 sm:p-0 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none"
            aria-label="Next Page"
          >
            <ChevronRight className="w-8 h-8 sm:w-14 sm:h-14 stroke-[2]" />
          </button>

          {/* Centered Scroll Wrapper using Grid for perfect scrolling without top/left cropping */}
          <div className="min-w-full min-h-full grid place-items-center p-2 sm:p-4">
            <div
              style={{
                width: `${wrapperWidth}px`,
                height: `${wrapperHeight}px`,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {/* The scaled container wrapper utilizing absolute centered translate scale */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: `translate(-50%, -50%) scale(${finalScale})`,
                  transformOrigin: "center center",
                  width: `${bookDimensions.width * (usePortraitMode ? 1 : 2)}px`,
                  height: `${bookDimensions.height}px`,
                  // FlowPaper style drop shadows
                  filter:
                    "drop-shadow(0 25px 35px rgba(0, 0, 0, 0.55)) drop-shadow(0 12px 18px rgba(0, 0, 0, 0.45))",
                }}
              >
                {/* @ts-ignore */}
                <HTMLFlipBook
                  ref={flipBookRef}
                  width={bookDimensions.width}
                  height={bookDimensions.height}
                  size="fixed"
                  showCover={true}
                  drawShadow={true}
                  flippingTime={700}
                  usePortrait={usePortraitMode}
                  startPage={currentPage}
                  maxShadowOpacity={0.5}
                  mobileScrollSupport={false}
                  clickEventForward={false}
                  swipeDistance={zoom > 1.0 ? 99999 : 30}
                  showPageCorners={true}
                  onFlip={handleFlip}
                  className="flipbook-container"
                  style={{}}
                >
                  {Array.from({ length: numPages }, (_, i) => (
                    <FlipPage
                      key={i}
                      pdfDoc={pdfDoc}
                      lowResSrc={lowResPages[i]}
                      pageNumber={i + 1}
                      totalPages={numPages}
                      usePortraitMode={usePortraitMode}
                      isNearby={isPageNearby(i + 1)}
                      scale={isMobile ? 2.5 : 3.0}
                      zoom={debouncedZoom}
                    />
                  ))}
                </HTMLFlipBook>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Elegant Page Navigation panel ── */}
        <div
          onMouseEnter={() => setControlsHovered(true)}
          onMouseLeave={() => setControlsHovered(false)}
          className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300
            ${controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}
          `}
        >
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/85 backdrop-blur-md border border-white/10 shadow-2xl">
            {/* Page navigation */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  flipPrev();
                }}
                disabled={currentPage <= 0}
                className="p-1.5 rounded-full hover:bg-gold/10 text-gray-400 hover:text-gold disabled:opacity-20 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>

              <form onSubmit={handlePageSubmit} className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={pageInputVal}
                  onChange={(e) => setPageInputVal(e.target.value)}
                  className="w-8 h-6 bg-white/5 border border-white/10 rounded text-center text-xs text-gold focus:outline-none focus:border-gold/50 focus:bg-black/40 font-bold font-mono transition-all"
                />
                <span className="text-[10px] text-gray-500 font-bold font-mono">/</span>
                <span className="text-[10px] text-gray-400 font-bold font-mono min-w-[15px]">{numPages}</span>
              </form>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  flipNext();
                }}
                disabled={currentPage >= numPages - 1}
                className="p-1.5 rounded-full hover:bg-gold/10 text-gray-400 hover:text-gold disabled:opacity-20 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <div className="w-[1px] h-4 bg-white/10" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <button
                disabled={zoom <= 0.5}
                onClick={(e) => {
                  e.stopPropagation();
                  changeZoom(zoom - 0.25);
                }}
                className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-gold disabled:opacity-20 transition-all cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-bold font-mono text-white/80 select-none min-w-[32px] text-center tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <button
                disabled={zoom >= 3.0}
                onClick={(e) => {
                  e.stopPropagation();
                  changeZoom(zoom + 0.25);
                }}
                className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-gold disabled:opacity-20 transition-all cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="w-[1px] h-4 bg-white/10" />

            {/* Fit mode switch */}
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFitMode(fitMode === "page" ? "width" : "page");
                }}
                className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                title={fitMode === "page" ? "Fit to Width" : "Fit to Page"}
              >
                {fitMode === "page" ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="w-[1px] h-4 bg-white/10" />

            {/* Share control */}
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const { shareContent } = await import('@/lib/capacitor-init');
                  await shareContent(
                    title || "Kamma Voice Magazine", 
                    "Read the latest edition of Kamma Voice Magazine.", 
                    window.location.href
                  );
                } catch (e) {}
              }}
              className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
              title="Share Magazine"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-white/10" />

            {/* Fullscreen control */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Page Styles ── */}
      <style jsx global>{`
        .flipbook-container {
          margin: auto;
        }

        .stf__parent {
          perspective: 2500px;
          max-width: 100% !important;
          max-height: 100% !important;
          overflow: visible !important;
        }

        .stf__wrapper {
          overflow: visible !important;
        }
      `}</style>
    </div>
  );
}
