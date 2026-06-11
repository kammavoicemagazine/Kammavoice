"use client";

import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfReaderProps {
  url: string;
  title: string;
}

export default function PdfReader({ url, title }: PdfReaderProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Restore page number from localStorage
  useEffect(() => {
    const savedPage = localStorage.getItem(`magazine-page-${title}`);
    if (savedPage) {
      const parsed = parseInt(savedPage, 10);
      if (!isNaN(parsed) && parsed > 1) {
        setPageNumber(parsed);
      }
    }
  }, [title]);

  // Check mobile and handle resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      // On desktop (dual page), we move by 2 pages, except when at the cover
      const step = isMobile ? 1 : 2;
      const next = prevPageNumber + (offset * step);
      const finalPage = next < 1 ? 1 : next > numPages && numPages > 0 ? numPages : next;
      
      // Save to localStorage
      if (numPages > 0) {
        localStorage.setItem(`magazine-page-${title}`, finalPage.toString());
      }
      
      return finalPage;
    });
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        previousPage();
      } else if (e.key === "ArrowRight" || e.key === " ") {
        // Spacebar also goes next
        if (e.key === " ") e.preventDefault();
        nextPage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [numPages, isMobile]); // Re-bind when numPages/isMobile changes so changePage works correctly

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Determine pages to show based on desktop/mobile
  // If desktop, page 1 is cover (centered). 
  // Page 2 & 3 are side-by-side, 4 & 5, etc.
  const showDualPage = !isMobile && pageNumber > 1 && pageNumber < numPages;
  const leftPageNumber = pageNumber;
  const rightPageNumber = pageNumber + 1;

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A] text-white overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-14 bg-[#111111] border-b border-[#222222] flex items-center justify-between px-4 sm:px-6 shrink-0 z-10 shadow-md">
        <h1 className="font-[family-name:var(--font-playfair)] text-gold font-semibold truncate max-w-[200px] sm:max-w-md">
          {title}
        </h1>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 bg-[#1A1A1A] rounded-lg p-1">
            <button onClick={zoomOut} className="p-1.5 rounded hover:bg-[#333333] transition-colors" title="Zoom Out">
              <ZoomOut className="w-4 h-4 text-muted" />
            </button>
            <span className="text-xs font-medium w-10 text-center text-muted">
              {Math.round(scale * 100)}%
            </span>
            <button onClick={zoomIn} className="p-1.5 rounded hover:bg-[#333333] transition-colors" title="Zoom In">
              <ZoomIn className="w-4 h-4 text-muted" />
            </button>
          </div>
          
          <button onClick={toggleFullscreen} className="p-2 rounded hover:bg-[#1A1A1A] transition-colors hidden sm:block" title="Fullscreen">
            <Maximize className="w-4 h-4 text-muted" />
          </button>
        </div>
      </div>

      {/* Reader Area */}
      <div className="flex-1 relative overflow-auto custom-scrollbar" ref={containerRef}>
        <div className="min-h-full flex items-center justify-center p-4 sm:p-8">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex flex-col items-center text-gold gap-4">
                <Skeleton className="w-40 h-1.5 rounded-full" variant="gold" />
                <p className="font-[family-name:var(--font-playfair)] text-lg">Loading Magazine...</p>
              </div>
            }
            className="flex justify-center shadow-2xl transition-transform duration-300 origin-top"
          >
            {/* Single Page View (Mobile or Cover/Back Cover on Desktop) */}
            {(!showDualPage || isMobile) && (
              <Page 
                pageNumber={pageNumber} 
                scale={isMobile ? scale * (window.innerWidth / 600) : scale} 
                className="pdf-page-shadow"
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            )}

            {/* Dual Page View (Desktop) */}
            {showDualPage && !isMobile && (
              <div className="flex bg-[#111111] pdf-page-shadow">
                <Page 
                  pageNumber={leftPageNumber} 
                  scale={scale} 
                  className="border-r border-[#222222]" 
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
                {rightPageNumber <= numPages && (
                  <Page 
                    pageNumber={rightPageNumber} 
                    scale={scale} 
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                )}
              </div>
            )}
          </Document>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1A1A1A]/90 backdrop-blur-md border border-[#333333] rounded-full px-4 py-2 flex items-center gap-6 shadow-xl z-20">
        <button
          disabled={pageNumber <= 1}
          onClick={previousPage}
          className="p-2 rounded-full hover:bg-gold/20 hover:text-gold text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="text-sm font-medium tabular-nums min-w-[80px] text-center">
          {numPages ? (
            showDualPage && rightPageNumber <= numPages ? 
              `${leftPageNumber}-${rightPageNumber} / ${numPages}` : 
              `${pageNumber} / ${numPages}`
          ) : (
            "-- / --"
          )}
        </div>

        <button
          disabled={pageNumber >= numPages}
          onClick={nextPage}
          className="p-2 rounded-full hover:bg-gold/20 hover:text-gold text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <style jsx global>{`
        .pdf-page-shadow {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0A0A0A;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333333;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555555;
        }
      `}</style>
    </div>
  );
}
