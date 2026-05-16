"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface ImageUploaderProps {
  currentImage?: string;
  onUpload: (url: string, publicId: string) => void;
  onRemove?: () => void;
  label?: string;
}

export default function ImageUploader({
  currentImage,
  onUpload,
  onRemove,
  label = "Cover Image",
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be less than 10MB");
        return;
      }

      // Show local preview immediately
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);
      setIsUploading(true);

      try {
        const result = await uploadToCloudinary(file, {
          resourceType: "image",
          folder: label.toLowerCase().includes("cover") ? "magazine_covers" : "media",
        });
        setPreview(result.url);
        onUpload(result.url, result.publicId);
        toast.success("Image uploaded successfully");
      } catch (err: any) {
        toast.error(err.message || "Upload failed. Check Cloudinary configuration.");
        setPreview(currentImage || null);
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, currentImage]
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
    setPreview(null);
    onRemove?.();
  };

  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
        {label}
      </label>

      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-border-subtle group">
          <div className="relative w-full h-48 md:h-56">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
              </div>
            )}
          </div>
          {!isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-danger/80 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
            dragActive
              ? "border-gold bg-gold/5"
              : "border-border-subtle hover:border-gold/30 bg-surface"
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-3">
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-gold animate-spin" />
            ) : (
              <ImageIcon className="w-6 h-6 text-gold" />
            )}
          </div>
          <p className="text-sm text-muted mb-1">
            {isUploading ? "Uploading..." : "Click or drag to upload"}
          </p>
          <p className="text-[11px] text-muted/60">PNG, JPG, WebP — Max 10MB</p>
        </label>
      )}
    </div>
  );
}
