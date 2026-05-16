"use client";

import { useState, useCallback } from "react";
import { Upload, X, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface PdfUploaderProps {
  currentPdfUrl?: string;
  onUpload: (url: string, publicId: string) => void;
  onRemove?: () => void;
  label?: string;
}

export default function PdfUploader({
  currentPdfUrl,
  onUpload,
  onRemove,
  label = "Magazine PDF File",
}: PdfUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        toast.error("Please select a PDF file");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error("PDF must be less than 50MB");
        return;
      }

      setIsUploading(true);
      setProgress(0);

      try {
        const result = await uploadToCloudinary(file, {
          resourceType: "raw",
          folder: "magazines",
          onProgress: (p) => setProgress(p),
        });
        onUpload(result.url, result.publicId);
        toast.success("PDF uploaded successfully");
      } catch (err: any) {
        console.error("Cloudinary PDF Upload Error:", err);
        toast.error(err.message || "Upload failed. Check Cloudinary configuration.");
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    onRemove?.();
  };

  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
        {label}
      </label>

      {currentPdfUrl ? (
        <div className="relative rounded-xl p-6 border border-border-subtle bg-surface flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="font-medium">PDF Uploaded</p>
              <a 
                href={currentPdfUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-gold hover:underline"
              >
                View File
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="p-2 rounded-lg text-muted hover:bg-danger/10 hover:text-danger transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center w-full p-8 rounded-xl border-2 border-dashed transition-colors cursor-pointer relative overflow-hidden ${
            dragActive
              ? "border-gold bg-gold/5"
              : "border-border-subtle hover:border-gold/30 bg-surface"
          }`}
        >
          {isUploading && (
            <div 
              className="absolute bottom-0 left-0 h-1 bg-gold transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          )}

          <input
            type="file"
            accept="application/pdf"
            onChange={handleInputChange}
            className="hidden"
            disabled={isUploading}
          />
          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-3">
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-gold animate-spin" />
            ) : (
              <FileText className="w-6 h-6 text-gold" />
            )}
          </div>
          <p className="text-sm text-muted mb-1">
            {isUploading ? `Uploading... ${Math.round(progress)}%` : "Click or drag PDF to upload"}
          </p>
          <p className="text-[11px] text-muted/60">PDF only — Max 50MB</p>
        </label>
      )}
    </div>
  );
}
