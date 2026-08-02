// app/app-admin/components/FlipbookPreview.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import HTMLFlipBook from "react-pageflip";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// Set the worker src for pdfjs (adjust if needed)
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface FlipbookPreviewProps {
  pdfUrl: string;
}

const FlipbookPreview: React.FC<FlipbookPreviewProps> = ({ pdfUrl }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  // Reset when pdfUrl changes
  useEffect(() => {
    setLoading(true);
    setNumPages(0);
  }, [pdfUrl]);

  return (
    <div className="border border-border-subtle rounded-lg overflow-hidden bg-[#050505]">
      {loading && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-6 h-6 animate-spin text-gold" />
          <span className="ml-2 text-xs text-muted">Loading preview...</span>
        </div>
      )}
      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading=""
        className="hidden"
      />
      {!loading && numPages > 0 && (
        // @ts-ignore
        <HTMLFlipBook
          width={300}
          height={400}
          className="mx-auto"
        >
          {Array.from({ length: numPages }, (_, i) => (
            <div key={i} className="flex items-center justify-center bg-[#0A0A0A]">
              <Page pageNumber={i + 1} width={300} renderTextLayer={false} renderAnnotationLayer={false} />
            </div>
          ))}
        </HTMLFlipBook>
      )}
    </div>
  );
};

export default FlipbookPreview;
