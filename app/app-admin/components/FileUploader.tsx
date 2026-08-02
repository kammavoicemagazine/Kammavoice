// components/FileUploader.tsx
"use client";

import { useState } from "react";
import { uploadFile } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

interface Props {
  label: string;
  accept: string;
  folder: string;
  currentUrl: string;
  onUploadComplete: (url: string, storagePath?: string) => void;
  onRemove: () => void;
  onFileSelect?: (file: File) => void;
}

export default function FileUploader({
  label,
  accept,
  folder,
  currentUrl,
  onUploadComplete,
  onRemove,
  onFileSelect,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (onFileSelect) onFileSelect(file);
    setUploading(true);
    setProgress(0);
    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storagePath = `${folder}/${Date.now()}-${cleanFileName}`;
      const downloadUrl = await uploadFile(file, storagePath, (p) => setProgress(p));
      // Optional HEAD check
      try {
        const headResponse = await fetch(downloadUrl, { method: "HEAD" });
        if (!headResponse.ok) {
          console.warn("[FileUploader] HEAD request failed", headResponse.status);
        }
      } catch (headErr) {
        console.error("[FileUploader] HEAD error", headErr);
      }
      onUploadComplete(downloadUrl, storagePath);
      toast.success(`${label} uploaded successfully!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted">{label}</label>
      {currentUrl ? (
        <div className="flex items-center justify-between p-3 rounded-lg border border-border-subtle bg-surface-light">
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 rounded bg-gold/10 flex items-center justify-center text-gold shrink-0">✓</div>
            <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gold hover:underline truncate">{currentUrl}</a>
          </div>
          <button type="button" onClick={onRemove} className="p-1 text-xs hover:text-danger text-muted transition-colors cursor-pointer bg-transparent border-0">Remove</button>
        </div>
      ) : (
        <div className="relative border border-dashed border-border-subtle rounded-lg p-5 text-center hover:border-gold/30 transition-colors">
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {uploading ? (
            <div className="space-y-2">
              <Loader2 className="w-5 h-5 text-gold animate-spin mx-auto" />
              <p className="text-[10px] text-muted">Uploading... {progress}%</p>
              <div className="w-full bg-[#1A1A1A] rounded-full h-1">
                <div className="bg-gold h-1 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <UploadCloud className="w-5 h-5 text-gold/60 mx-auto" />
              <p className="text-xs text-foreground font-medium">Click or drag file to upload</p>
              <p className="text-[9px] text-muted font-mono">{accept}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
