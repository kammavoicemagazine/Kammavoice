"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ImageUploader from "@/components/ui/image-uploader";
import PdfUploader from "@/components/ui/pdf-uploader";
import { createMagazine, updateMagazine } from "@/lib/firestore";
import { slugify } from "@/lib/utils";
import type { Magazine } from "@/lib/types";

interface MagazineFormProps {
  magazine?: Magazine | null;
  mode: "create" | "edit";
}

export default function MagazineForm({ magazine, mode }: MagazineFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState(magazine?.title || "");
  const [titleTelugu, setTitleTelugu] = useState(magazine?.titleTelugu || "");
  const [slug, setSlug] = useState(magazine?.slug || "");
  const [issueDate, setIssueDate] = useState(magazine?.issueDate || "");
  const [volume, setVolume] = useState(magazine?.volume || "");
  const [category, setCategory] = useState(magazine?.category || "Monthly");
  const [year, setYear] = useState(magazine?.year || new Date().getFullYear());
  const [tags, setTags] = useState(magazine?.tags?.join(", ") || "");
  const [coverImageUrl, setCoverImageUrl] = useState(magazine?.coverImageUrl || "");
  const [coverImagePublicId, setCoverImagePublicId] = useState(magazine?.coverImagePublicId || "");
  const [pdfUrl, setPdfUrl] = useState(magazine?.pdfUrl || "");
  const [pdfPublicId, setPdfPublicId] = useState(magazine?.pdfPublicId || "");
  const [pageCount, setPageCount] = useState(magazine?.pageCount || 0);
  const [isPublished, setIsPublished] = useState(magazine?.isPublished ?? true);

  // Auto-generate slug when title changes (if not editing)
  useEffect(() => {
    if (mode === "create" && title) {
      setSlug(slugify(title));
    }
  }, [title, mode]);

  const validate = (): boolean => {
    if (!title.trim()) { toast.error("Title is required"); return false; }
    if (!slug.trim()) { toast.error("Slug is required"); return false; }
    if (!issueDate.trim()) { toast.error("Issue Date is required"); return false; }
    if (!volume.trim()) { toast.error("Volume info is required"); return false; }
    if (!coverImageUrl) { toast.error("Cover image is required"); return false; }
    if (!pdfUrl) { toast.error("Magazine PDF file is required"); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const magazineData: any = {
        title,
        slug,
        issueDate,
        volume,
        category,
        year: Number(year),
        tags: tags.split(",").map(t => t.trim()).filter(t => t),
        coverImageUrl,
        pdfUrl,
        pageCount: Number(pageCount) || 0,
        isPublished,
      };

      if (titleTelugu) magazineData.titleTelugu = titleTelugu;
      if (coverImagePublicId) magazineData.coverImagePublicId = coverImagePublicId;
      if (pdfPublicId) magazineData.pdfPublicId = pdfPublicId;

      if (mode === "create") {
        await createMagazine(magazineData);
        toast.success("Magazine published successfully!");
      } else if (magazine?.id) {
        await updateMagazine(magazine.id, magazineData);
        toast.success("Magazine updated successfully!");
      }

      router.push("/admin/magazines");
    } catch (err) {
      console.error(err);
      toast.error(mode === "create" ? "Failed to publish magazine" : "Failed to update magazine");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-lg bg-[#0A0A0A] border border-border-subtle text-sm text-foreground placeholder-muted focus:outline-none focus:border-gold/40 transition-colors";
  const labelClass = "block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-playfair)]">
            {mode === "create" ? "New Magazine Issue" : "Edit Magazine Issue"}
          </h1>
        </div>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4" /> {mode === "create" ? "Publish" : "Update"}</>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Metadata */}
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-border-subtle bg-surface space-y-4">
            <h2 className="font-bold text-lg mb-4">Issue Details</h2>
            
            <div>
              <label className={labelClass}>Title (English) *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Kamma Voice Anniversary Edition"
                className={inputClass}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Title (Telugu)</label>
                <input
                  type="text"
                  value={titleTelugu}
                  onChange={(e) => setTitleTelugu(e.target.value)}
                  placeholder="తెలుగులో శీర్షిక..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Slug *</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g., anniversary-edition"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Issue Date *</label>
                <input
                  type="text"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  placeholder="e.g., May 2026"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Volume Info *</label>
                <input
                  type="text"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  placeholder="e.g., Vol. 1, Issue 5"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Monthly"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  placeholder="e.g., 2026"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Tags (comma separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., Politics, Cinema, Business"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Page Count</label>
                <input
                  type="number"
                  value={pageCount}
                  onChange={(e) => setPageCount(Number(e.target.value))}
                  placeholder="e.g., 42"
                  className={inputClass}
                />
              </div>
              <div className="flex items-center mt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded border-border-subtle accent-gold"
                  />
                  <span className="text-sm">Published to Public</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Media Uploads */}
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-border-subtle bg-surface">
            <h2 className="font-bold text-lg mb-4">Cover Image *</h2>
            <ImageUploader
              currentImage={coverImageUrl}
              onUpload={(url, publicId) => {
                setCoverImageUrl(url);
                setCoverImagePublicId(publicId);
              }}
              onRemove={() => {
                setCoverImageUrl("");
                setCoverImagePublicId("");
              }}
              label="High-Res Cover Image (Cloudinary)"
            />
          </div>

          <div className="p-6 rounded-xl border border-border-subtle bg-surface">
            <h2 className="font-bold text-lg mb-4">Magazine PDF *</h2>
            <PdfUploader
              currentPdfUrl={pdfUrl}
              onUpload={(url, publicId) => {
                setPdfUrl(url);
                setPdfPublicId(publicId);
              }}
              onRemove={() => {
                setPdfUrl("");
                setPdfPublicId("");
              }}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
