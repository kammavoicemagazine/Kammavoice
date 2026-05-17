"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, ArrowLeft, Globe, RefreshCw, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ImageUploader from "@/components/ui/image-uploader";
import PdfUploader from "@/components/ui/pdf-uploader";
import { createMagazine, updateMagazine, getMagazineAllPageTranslations } from "@/lib/firestore";
import { slugify } from "@/lib/utils";
import type { Magazine, MagazinePageTranslation } from "@/lib/types";
import { pdfjs } from "react-pdf";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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

  // Translation State
  const [translations, setTranslations] = useState<MagazinePageTranslation[]>([]);
  const [isProcessingTranslations, setIsProcessingTranslations] = useState(false);
  const [processingPage, setProcessingPage] = useState<number | null>(null);

  const fetchTranslations = async () => {
    if (mode === "edit" && magazine?.id) {
      const data = await getMagazineAllPageTranslations(magazine.id);
      setTranslations(data);
    }
  };

  useEffect(() => {
    fetchTranslations();
  }, [mode, magazine]);

  /** Helper to render a PDF page to base64 with 1.0 scale and 0.45 quality to minimize Vercel memory/payload size */
  const renderPdfPageToBase64 = async (pdfDoc: any, pageNum: number): Promise<string> => {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    
    // User requested: reduce render scale to 1.0, convert to compressed JPEG with 0.45 quality
    const base64 = canvas.toDataURL("image/jpeg", 0.45);
    page.cleanup();
    return base64;
  };

  /** Process translation for a single page across 4 distinct resumable stages */
  const processTranslationForPage = async (pageNum: number, pdfDoc: any, totalPages: number) => {
    if (!magazine?.id) return;
    setProcessingPage(pageNum);
    try {
      // Find existing translation state if any
      const currentTrans = translations.find(t => t.pageNumber === pageNum);
      const currentStatus = currentTrans?.status;

      // STAGE 1: OCR ONLY
      if (!currentStatus || currentStatus === "pending" || currentStatus === "processing" || currentStatus === "failed" || !currentTrans?.originalText) {
        toast.loading(`Page ${pageNum}: Stage 1/4 (Telugu OCR)...`, { id: "translation-progress" });
        const base64Image = await renderPdfPageToBase64(pdfDoc, pageNum);
        const res = await fetch(`/api/magazine/${magazine.id}/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64Image, pageNumber: pageNum, totalPages, stage: "ocr" }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Page ${pageNum} OCR failed`);
        }
      }

      // STAGE 2: TRANSLATE ENGLISH
      if (!currentTrans?.translations?.en) {
        toast.loading(`Page ${pageNum}: Stage 2/4 (English Translation)...`, { id: "translation-progress" });
        const res = await fetch(`/api/magazine/${magazine.id}/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageNumber: pageNum, totalPages, stage: "translate_en" }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Page ${pageNum} English translation failed`);
        }
      }

      // STAGE 3: TRANSLATE KANNADA
      if (!currentTrans?.translations?.kn) {
        toast.loading(`Page ${pageNum}: Stage 3/4 (Kannada Translation)...`, { id: "translation-progress" });
        const res = await fetch(`/api/magazine/${magazine.id}/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageNumber: pageNum, totalPages, stage: "translate_kn" }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Page ${pageNum} Kannada translation failed`);
        }
      }

      // STAGE 4: TRANSLATE TAMIL
      if (!currentTrans?.translations?.ta) {
        toast.loading(`Page ${pageNum}: Stage 4/4 (Tamil Translation)...`, { id: "translation-progress" });
        const res = await fetch(`/api/magazine/${magazine.id}/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageNumber: pageNum, totalPages, stage: "translate_ta" }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Page ${pageNum} Tamil translation failed`);
        }
      }

      // Refresh translations after full page completion
      await fetchTranslations();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || `Failed to translate page ${pageNum}`);
      throw error; // Rethrow to stop bulk loop on failure
    } finally {
      setProcessingPage(null);
    }
  };

  /** Handle bulk processing of missing/failed translations */
  const handleProcessMissingTranslations = async () => {
    if (!magazine?.id || !pdfUrl) {
      toast.error("Magazine PDF is required before processing translations.");
      return;
    }

    setIsProcessingTranslations(true);
    toast.info("Initializing AI Multimodal Translation Pipeline...");

    try {
      const loadingTask = pdfjs.getDocument(pdfUrl);
      const pdfDoc = await loadingTask.promise;
      const totalPages = pdfDoc.numPages;

      const existingMap = new Map(translations.map(t => [t.pageNumber, t.status]));

      for (let i = 1; i <= totalPages; i++) {
        const status = existingMap.get(i);
        if (status !== "completed") {
          toast.loading(`Processing Page ${i} of ${totalPages}...`, { id: "translation-progress" });
          await processTranslationForPage(i, pdfDoc, totalPages);
        }
      }

      toast.success("AI Translation Pipeline completed successfully!", { id: "translation-progress" });
    } catch (error: any) {
      console.error(error);
      toast.error("Translation pipeline encountered an error.", { id: "translation-progress" });
    } finally {
      setIsProcessingTranslations(false);
    }
  };

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

      {/* Translation Management Section (Only in Edit Mode) */}
      {mode === "edit" && magazine && (
        <div className="p-6 rounded-xl border border-border-subtle bg-surface space-y-6 mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
            <div>
              <h2 className="text-xl font-bold font-[family-name:var(--font-playfair)] flex items-center gap-2 text-gold">
                <Globe className="w-6 h-6" /> Multimodal AI Translation Management
              </h2>
              <p className="text-sm text-muted mt-1">
                Extract Telugu OCR and translate magazine pages into English, Kannada, and Tamil using Gemini AI.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={fetchTranslations}
                disabled={isProcessingTranslations || processingPage !== null}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isProcessingTranslations ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleProcessMissingTranslations}
                disabled={isProcessingTranslations || processingPage !== null || !pdfUrl}
                className="flex items-center gap-2 bg-gold text-black hover:bg-gold-light"
              >
                {isProcessingTranslations ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing AI...</>
                ) : (
                  <><Globe className="w-4 h-4" /> Process Missing Pages</>
                )}
              </Button>
            </div>
          </div>

          {/* Observability Analytics Bar */}
          {(() => {
            const completedCount = translations.filter(t => t.status === "completed").length;
            const failedCount = translations.filter(t => t.status === "failed").length;
            const validTimes = translations.filter(t => t.executionTimeMs);
            const avgTime = validTimes.length > 0 
              ? Math.round(validTimes.reduce((acc, t) => acc + (t.executionTimeMs || 0), 0) / validTimes.length) 
              : 0;
            const totalTokens = translations.reduce((acc, t) => acc + (t.estimatedTokens || 0), 0);

            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-surface-hover border border-border-subtle shadow-inner">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted font-semibold uppercase tracking-wider">Translated Pages</span>
                  <span className="text-xl font-bold text-green-500">{completedCount} / {pageCount || magazine.pageCount || 0}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted font-semibold uppercase tracking-wider">Failed Pages</span>
                  <span className="text-xl font-bold text-red-500">{failedCount}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted font-semibold uppercase tracking-wider">Avg AI Response</span>
                  <span className="text-xl font-bold text-gold">{avgTime ? `${avgTime}ms` : "N/A"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted font-semibold uppercase tracking-wider">Est. Token Usage</span>
                  <span className="text-xl font-bold text-blue-400">{totalTokens ? `~${totalTokens.toLocaleString()}` : "N/A"}</span>
                </div>
              </div>
            );
          })()}

          {/* Pages Grid */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider">Page Translation Status</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {Array.from({ length: pageCount || magazine.pageCount || 0 }, (_, i) => i + 1).map((pageNum) => {
                const trans = translations.find(t => t.pageNumber === pageNum);
                const isCurrentProcessing = processingPage === pageNum;

                let statusColor = "border-border-subtle bg-surface-hover text-muted";
                let statusIcon = <Clock className="w-3.5 h-3.5" />;
                let statusLabel = "Missing";

                if (isCurrentProcessing) {
                  statusColor = "border-yellow-500/50 bg-yellow-500/10 text-yellow-500 animate-pulse";
                  statusIcon = <Loader2 className="w-3.5 h-3.5 animate-spin" />;
                  statusLabel = "Processing";
                } else if (trans?.status === "completed") {
                  statusColor = "border-green-500/50 bg-green-500/10 text-green-500";
                  statusIcon = <CheckCircle2 className="w-3.5 h-3.5" />;
                  statusLabel = `Done (${trans.confidenceScore || 100}%)`;
                } else if (trans?.status === "failed") {
                  statusColor = "border-red-500/50 bg-red-500/10 text-red-500";
                  statusIcon = <AlertCircle className="w-3.5 h-3.5" />;
                  statusLabel = "Failed";
                } else if (trans?.status === "processing") {
                  statusColor = "border-yellow-500/50 bg-yellow-500/10 text-yellow-500";
                  statusIcon = <Loader2 className="w-3.5 h-3.5 animate-spin" />;
                  statusLabel = "Queued";
                }

                return (
                  <div
                    key={pageNum}
                    className={`p-3 rounded-lg border ${statusColor} flex flex-col items-center justify-center text-center gap-1.5 transition-all relative group`}
                  >
                    <span className="text-xs font-bold text-foreground">Page {pageNum}</span>
                    <div className="flex items-center gap-1 text-[10px] font-medium">
                      {statusIcon}
                      <span>{statusLabel}</span>
                    </div>

                    {/* Hover Action to Retry Individual Page */}
                    {trans?.status !== "completed" && !isCurrentProcessing && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!pdfUrl) return;
                          const loadingTask = pdfjs.getDocument(pdfUrl);
                          const pdfDoc = await loadingTask.promise;
                          await processTranslationForPage(pageNum, pdfDoc, magazine.pageCount);
                        }}
                        className="absolute inset-0 bg-black/80 text-gold text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center backdrop-blur-sm transition-opacity"
                      >
                        Retry Page {pageNum}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
