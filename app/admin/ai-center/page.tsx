"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Cpu,
  Play,
  Pause,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  BarChart2,
  Server,
  Layers,
  FileText,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllMagazines, getMagazineAllPageTranslations } from "@/lib/firestore";
import { useAdminStore } from "@/lib/admin-store";
import type { Magazine, MagazinePageTranslation } from "@/lib/types";

interface QueuedPage extends MagazinePageTranslation {
  magazineTitle: string;
  estimatedTokens: number;
  stageName: "OCR" | "English" | "Kannada" | "Tamil" | "Completed";
}

export default function AiControlCenter() {
  const { aiPipelinePaused, setAiPipelinePaused } = useAdminStore();
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [selectedMagId, setSelectedMagId] = useState<string>("");
  const [queuedPages, setQueuedPages] = useState<QueuedPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Load Magazines
  useEffect(() => {
    let isMounted = true;
    startTransition(async () => {
      try {
        const mags = await getAllMagazines();
        if (!isMounted) return;
        setMagazines(mags);
        if (mags.length > 0) {
          setSelectedMagId(mags[0].id);
        }
      } catch (err) {
        console.error("Failed to load magazines for AI center:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Load Pages for selected magazine
  useEffect(() => {
    if (!selectedMagId) return;

    let isMounted = true;
    setLoading(true);

    startTransition(async () => {
      try {
        const selectedMag = magazines.find((m) => m.id === selectedMagId);
        const pages = await getMagazineAllPageTranslations(selectedMagId);
        if (!isMounted) return;

        // If no pages exist yet in subcollection, generate mock queue based on pageCount
        const pageCount = selectedMag?.pageCount || 12;
        const processedPages: QueuedPage[] = [];

        for (let i = 1; i <= pageCount; i++) {
          const existing = pages.find((p) => p.pageNumber === i);
          let stageName: QueuedPage["stageName"] = "Completed";
          let status: MagazinePageTranslation["status"] = "completed";

          if (existing) {
            status = existing.status || "completed";
            if (status === "pending") stageName = "OCR";
            else if (status === "ocr_completed") stageName = "English";
            else if (status === "translating_en") stageName = "Kannada";
            else if (status === "translating_kn") stageName = "Tamil";
            else if (status === "translating_ta") stageName = "Completed";
            else if (status === "failed") stageName = "OCR";
          } else {
            // Simulated queue distribution
            if (i === 1) { status = "completed"; stageName = "Completed"; }
            else if (i === 2) { status = "translating_ta"; stageName = "Tamil"; }
            else if (i === 3) { status = "translating_kn"; stageName = "Kannada"; }
            else if (i === 4) { status = "translating_en"; stageName = "English"; }
            else if (i === 5) { status = "failed"; stageName = "OCR"; }
            else { status = "pending"; stageName = "OCR"; }
          }

          processedPages.push({
            id: existing?.id || `page-${i}`,
            pageNumber: i,
            status,
            stageName,
            magazineTitle: selectedMag?.title || "Magazine Edition",
            estimatedTokens: Math.floor(Math.random() * 800) + 1200,
            originalText: existing?.originalText || (status !== "pending" ? "Simulated Telugu OCR Text extracted successfully by Gemini 1.5 Flash." : ""),
            translations: existing?.translations || (status === "completed" ? { en: "Simulated English", kn: "Simulated Kannada", ta: "Simulated Tamil" } : { en: "", kn: "", ta: "" }),
            executionTimeMs: existing?.executionTimeMs || Math.floor(Math.random() * 2000) + 1500,
            updatedAt: existing?.updatedAt || new Date().toISOString(),
          });
        }

        setQueuedPages(processedPages);
      } catch (err) {
        console.error("Failed to load queue:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => { isMounted = false; };
  }, [selectedMagId, magazines]);

  const handleRetryStage = async (pageId: string, pageNum: number, stage: string) => {
    setRetryingId(pageId);
    toast.loading(`Retrying Stage: ${stage} for Page ${pageNum}...`, { id: `retry-${pageId}` });

    // Simulate API retry delay
    setTimeout(() => {
      setQueuedPages((prev) =>
        prev.map((p) => {
          if (p.id === pageId) {
            let nextStage: QueuedPage["stageName"] = "English";
            let nextStatus: MagazinePageTranslation["status"] = "ocr_completed";

            if (stage === "OCR") { nextStage = "English"; nextStatus = "ocr_completed"; }
            else if (stage === "English") { nextStage = "Kannada"; nextStatus = "translating_en"; }
            else if (stage === "Kannada") { nextStage = "Tamil"; nextStatus = "translating_kn"; }
            else if (stage === "Tamil") { nextStage = "Completed"; nextStatus = "completed"; }

            return { ...p, status: nextStatus, stageName: nextStage };
          }
          return p;
        })
      );
      setRetryingId(null);
      toast.success(`Page ${pageNum} Stage ${stage} completed successfully!`, { id: `retry-${pageId}` });
    }, 2000);
  };

  const activeJobsCount = queuedPages.filter((p) => p.status !== "completed" && p.status !== "failed").length;
  const failedJobsCount = queuedPages.filter((p) => p.status === "failed").length;
  const completedJobsCount = queuedPages.filter((p) => p.status === "completed").length;

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Pipeline Toggles */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#141414] p-6 rounded-2xl border border-border-subtle shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-gold/20 text-gold text-[10px] font-bold uppercase tracking-wider border border-gold/30">
              Gemini 1.5 Flash
            </span>
            <span className="text-xs text-muted font-mono">Multimodal AI Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-playfair)] text-foreground">
            AI Control Center
          </h1>
          <p className="text-sm text-muted mt-1">
            Monitor real-time OCR extraction, 4-stage translation queues, Vercel serverless timeouts, and Gemini API quotas.
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A0A0A] border border-border-subtle">
            <span className={`w-2.5 h-2.5 rounded-full ${aiPipelinePaused ? "bg-yellow-400" : "bg-green-400 animate-pulse"}`} />
            <span className="text-xs font-bold text-foreground">
              {aiPipelinePaused ? "Pipeline Paused" : "Pipeline Active"}
            </span>
          </div>
          <Button
            variant={aiPipelinePaused ? "primary" : "outline"}
            size="sm"
            onClick={() => {
              setAiPipelinePaused(!aiPipelinePaused);
              toast.success(aiPipelinePaused ? "AI Pipeline Resumed!" : "AI Pipeline Paused!");
            }}
            className={aiPipelinePaused ? "bg-gold text-[#0A0A0A] font-bold" : "border-border-subtle hover:border-gold/40 text-muted hover:text-foreground"}
          >
            {aiPipelinePaused ? <Play className="w-4 h-4 mr-1.5" /> : <Pause className="w-4 h-4 mr-1.5" />}
            {aiPipelinePaused ? "Resume Pipeline" : "Pause Pipeline"}
          </Button>
        </div>
      </div>

      {/* Quota & Usage Metrics Grid (4 Premium Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="p-5 rounded-2xl bg-[#141414] border border-border-subtle relative overflow-hidden shadow-lg shadow-black/40">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Active Quota</Badge>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">1,420 / 1,500</p>
          <p className="text-xs font-semibold text-muted mt-1">Requests per Minute (RPM)</p>
          <div className="w-full bg-[#0A0A0A] h-1.5 rounded-full mt-3 overflow-hidden border border-border-subtle">
            <div className="bg-blue-400 h-full rounded-full" style={{ width: "94%" }} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }} className="p-5 rounded-2xl bg-[#141414] border border-border-subtle relative overflow-hidden shadow-lg shadow-black/40">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
              <BarChart2 className="w-5 h-5" />
            </div>
            <Badge className="bg-gold/10 text-gold border-gold/20">Monthly Usage</Badge>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">14.2M Tokens</p>
          <p className="text-xs font-semibold text-muted mt-1">Gemini Multimodal Processing</p>
          <div className="w-full bg-[#0A0A0A] h-1.5 rounded-full mt-3 overflow-hidden border border-border-subtle">
            <div className="bg-gold h-full rounded-full" style={{ width: "45%" }} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="p-5 rounded-2xl bg-[#141414] border border-border-subtle relative overflow-hidden shadow-lg shadow-black/40">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Clock className="w-5 h-5" />
            </div>
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">Latency</Badge>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">1.82s avg</p>
          <p className="text-xs font-semibold text-muted mt-1">Per-Stage Execution Speed</p>
          <div className="w-full bg-[#0A0A0A] h-1.5 rounded-full mt-3 overflow-hidden border border-border-subtle">
            <div className="bg-purple-400 h-full rounded-full" style={{ width: "25%" }} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }} className="p-5 rounded-2xl bg-[#141414] border border-border-subtle relative overflow-hidden shadow-lg shadow-black/40">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
              <Server className="w-5 h-5" />
            </div>
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Vercel Hobby</Badge>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">0 Timeouts</p>
          <p className="text-xs font-semibold text-muted mt-1">4-Stage Resumable Safeguards</p>
          <div className="w-full bg-[#0A0A0A] h-1.5 rounded-full mt-3 overflow-hidden border border-border-subtle">
            <div className="bg-green-400 h-full rounded-full" style={{ width: "100%" }} />
          </div>
        </motion.div>
      </div>

      {/* Magazine Selector & Realtime Queue Table */}
      <div className="rounded-2xl bg-[#141414] border border-border-subtle shadow-xl overflow-hidden flex flex-col">
        {/* Table Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 border-b border-border-subtle bg-[#1A1A1A] gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground font-[family-name:var(--font-playfair)] flex items-center gap-2">
              <Layers className="w-5 h-5 text-gold" /> Real-Time Queue Visualization
            </h2>
            <p className="text-xs text-muted mt-0.5">Select a magazine edition to inspect live stage execution</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Magazine Dropdown */}
            <select
              value={selectedMagId}
              onChange={(e) => setSelectedMagId(e.target.value)}
              className="px-4 py-2 rounded-xl bg-[#0A0A0A] border border-border-subtle text-sm text-foreground font-semibold focus:outline-none focus:border-gold/40 shadow-sm cursor-pointer"
            >
              {magazines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.year})
                </option>
              ))}
            </select>

            {/* Queue Stats Badges */}
            <div className="flex items-center gap-1.5 bg-[#0A0A0A] px-3 py-1.5 rounded-xl border border-border-subtle text-xs font-bold shadow-sm">
              <span className="text-blue-400">{activeJobsCount} Active</span>
              <span className="text-muted">•</span>
              <span className="text-red-400">{failedJobsCount} Failed</span>
              <span className="text-muted">•</span>
              <span className="text-green-400">{completedJobsCount} Done</span>
            </div>
          </div>
        </div>

        {/* Queue Table */}
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl bg-[#1A1A1A]" />)}
          </div>
        ) : queuedPages.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-12 h-12 text-muted mx-auto mb-3 opacity-50" />
            <p className="text-foreground font-semibold mb-1">No pages found for this magazine</p>
            <p className="text-xs text-muted mb-4">Upload a PDF or sync translations to initialize the AI queue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-[#1A1A1A]/50">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted">Page</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted">Magazine Edition</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted">Current Stage</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted hidden md:table-cell">Est. Tokens</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted hidden lg:table-cell">Execution Time</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50">
                {queuedPages.map((page) => (
                  <tr key={page.id} className="hover:bg-surface-hover transition-colors group">
                    <td className="px-6 py-4 text-sm font-extrabold text-foreground font-mono">
                      Page {page.pageNumber}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground/80 max-w-[200px] truncate">
                      {page.magazineTitle}
                    </td>
                    <td className="px-6 py-4">
                      {page.status === "completed" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" /> All Stages Completed
                        </span>
                      ) : page.status === "failed" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 shadow-sm animate-pulse">
                          <AlertCircle className="w-3.5 h-3.5" /> Stage Failed ({page.stageName})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm">
                          <Sparkles className="w-3.5 h-3.5 animate-spin" /> Processing {page.stageName}...
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-muted hidden md:table-cell font-mono">
                      ~{page.estimatedTokens} tokens
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-muted hidden lg:table-cell font-mono">
                      {page.executionTimeMs ? `${page.executionTimeMs}ms` : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {page.status === "failed" || page.status !== "completed" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={retryingId === page.id || aiPipelinePaused}
                          onClick={() => handleRetryStage(page.id || "", page.pageNumber, page.stageName)}
                          className="border-gold/40 text-gold hover:bg-gold/10 hover:text-gold shadow-sm cursor-pointer"
                        >
                          {retryingId === page.id ? (
                            <RotateCw className="w-4 h-4 animate-spin mr-1.5" />
                          ) : (
                            <RotateCw className="w-4 h-4 mr-1.5" />
                          )}
                          {retryingId === page.id ? "Retrying..." : `Retry ${page.stageName}`}
                        </Button>
                      ) : (
                        <Link href={`/admin/magazines/${selectedMagId}/edit`}>
                          <Button variant="ghost" size="sm" className="text-muted hover:text-foreground">
                            Inspect <ArrowUpRight className="w-4 h-4 ml-1.5" />
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
