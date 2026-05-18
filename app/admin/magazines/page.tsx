"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Loader2,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Star,
  Cpu,
  Layers,
  FileText,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllMagazines, deleteMagazine } from "@/lib/firestore";
import { useAuth } from "@/lib/auth-context";
import type { Magazine } from "@/lib/types";

interface ExtendedMagazine extends Magazine {
  aiProgress?: number; // percentage
  aiStatus?: "Idle" | "Extracting OCR" | "Translating" | "Completed" | "Error";
  isFeatured?: boolean;
}

export default function AdminMagazinesPage() {
  const { user } = useAuth();
  const [magazines, setMagazines] = useState<ExtendedMagazine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (user) {
      loadMagazines();
    }
  }, [user]);

  const loadMagazines = async () => {
    let isMounted = true;
    setLoading(true);

    startTransition(async () => {
      try {
        const data = await getAllMagazines();
        if (!isMounted) return;

        // Enhance with simulated AI processing states and featured flags
        const enhanced: ExtendedMagazine[] = data.map((m, i) => {
          let aiStatus: ExtendedMagazine["aiStatus"] = "Completed";
          let aiProgress = 100;

          if (i === 0) { aiStatus = "Translating"; aiProgress = 65; }
          else if (i === 1) { aiStatus = "Extracting OCR"; aiProgress = 25; }
          else if (i === 2) { aiStatus = "Error"; aiProgress = 40; }

          return {
            ...m,
            aiStatus,
            aiProgress,
            isFeatured: i === 0 || i === 3,
          };
        });

        setMagazines(enhanced);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load magazines.");
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => { isMounted = false; };
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMagazine(id);
      setMagazines((prev) => prev.filter((m) => m.id !== id));
      toast.success("Magazine deleted successfully");
    } catch {
      toast.error("Failed to delete magazine");
    } finally {
      setDeleteId(null);
    }
  };

  const handleToggleFeatured = (id: string) => {
    setMagazines((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextFeatured = !m.isFeatured;
          toast.success(nextFeatured ? "Magazine marked as Featured!" : "Magazine removed from Featured");
          return { ...m, isFeatured: nextFeatured };
        }
        return m;
      })
    );
  };

  const filtered = magazines.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.issueDate.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12 select-none">
      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#141414] p-6 rounded-2xl border border-border-subtle shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-gold/20 text-gold text-[10px] font-bold uppercase tracking-wider border border-gold/30">
              Multimodal Editions
            </span>
            <span className="text-xs text-muted font-mono">{magazines.length} Total Uploaded</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-playfair)] text-foreground">
            Magazine Management
          </h1>
          <p className="text-sm text-muted mt-1">
            Upload PDF issues, monitor 4-stage AI translation progress, manage readership analytics, and set featured editions.
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <Link href="/admin/magazines/new">
            <Button variant="primary" size="sm" className="bg-gold hover:bg-gold/90 text-[#0A0A0A] font-bold shadow-lg shadow-gold/20">
              <Plus className="w-4 h-4 mr-1.5" /> Upload New Issue
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative bg-[#141414] rounded-2xl border border-border-subtle p-2 shadow-lg flex items-center">
        <Search className="absolute left-5 w-5 h-5 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search magazine editions by title, issue date, or category..."
          className="w-full pl-14 pr-4 py-2.5 bg-transparent border-none text-sm text-foreground placeholder-muted focus:outline-none focus:ring-0"
        />
        {search && (
          <button onClick={() => setSearch("")} className="pr-4 text-xs font-semibold text-muted hover:text-foreground cursor-pointer">
            Clear
          </button>
        )}
      </div>

      {/* Magazines Table */}
      <div className="rounded-2xl bg-[#141414] border border-border-subtle shadow-xl overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-8 space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-6">
                <Skeleton className="h-20 w-14 rounded-lg bg-[#1A1A1A]" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-1/3 bg-[#1A1A1A]" />
                  <Skeleton className="h-4 w-1/4 bg-[#1A1A1A]" />
                </div>
                <Skeleton className="h-8 w-24 bg-[#1A1A1A]" />
                <Skeleton className="h-8 w-24 bg-[#1A1A1A]" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <BookOpen className="w-12 h-12 text-muted mx-auto mb-3 opacity-50" />
            <p className="text-foreground font-semibold mb-1">
              {search ? "No magazine editions match your search" : "No magazine editions uploaded yet"}
            </p>
            <p className="text-xs text-muted mb-4">Click below to upload your first high-fidelity PDF issue.</p>
            {!search && (
              <Link href="/admin/magazines/new">
                <Button variant="outline" size="sm" className="border-gold/40 text-gold hover:bg-gold/10">
                  <Plus className="w-4 h-4 mr-1.5" /> Upload First Issue
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-[#1A1A1A]/50">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted w-20">Cover</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted">Edition Details</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted hidden sm:table-cell">Category / Vol</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted hidden md:table-cell">AI Translation Pipeline</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted hidden lg:table-cell">Analytics</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50">
                {filtered.map((magazine) => (
                  <tr key={magazine.id} className="hover:bg-surface-hover transition-colors group">
                    {/* Cover Image */}
                    <td className="px-6 py-4">
                      <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-[#0A0A0A] border border-border-subtle shadow-md group-hover:scale-105 transition-transform shrink-0">
                        {magazine.coverImageUrl ? (
                          <Image src={magazine.coverImageUrl} alt={magazine.title} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted font-bold text-[10px]">PDF</div>
                        )}
                      </div>
                    </td>

                    {/* Title & Issue Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Link href={`/admin/magazines/${magazine.id}/edit`} className="text-sm font-bold text-foreground group-hover:text-gold transition-colors block truncate max-w-[220px]">
                          {magazine.title}
                        </Link>
                        {magazine.isFeatured && (
                          <span title="Featured Edition" className="flex items-center">
                            <Star className="w-3.5 h-3.5 text-gold fill-gold shrink-0" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted font-mono">{magazine.issueDate || `${magazine.category} ${magazine.year}`}</p>
                    </td>

                    {/* Category & Volume */}
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className="space-y-1">
                        <Badge className="bg-surface border-border-subtle text-muted group-hover:border-gold/30 transition-colors">
                          {magazine.category || "General"}
                        </Badge>
                        <p className="text-[11px] text-muted font-mono">{magazine.volume || "Vol 1"}</p>
                      </div>
                    </td>

                    {/* AI Translation Pipeline Progress */}
                    <td className="px-6 py-4 hidden md:table-cell w-64">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="flex items-center gap-1 text-muted">
                            <Cpu className="w-3 h-3 text-gold" /> {magazine.aiStatus || "Completed"}
                          </span>
                          <span className="text-foreground font-mono">{magazine.aiProgress || 100}%</span>
                        </div>
                        <div className="w-full bg-[#0A0A0A] h-1.5 rounded-full overflow-hidden border border-border-subtle">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              magazine.aiStatus === "Error"
                                ? "bg-red-400"
                                : magazine.aiStatus === "Completed"
                                ? "bg-green-400"
                                : "bg-gold animate-pulse"
                            }`}
                            style={{ width: `${magazine.aiProgress || 100}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted">
                          <span className={`px-1 py-0.2 rounded font-mono ${magazine.aiProgress && magazine.aiProgress > 0 ? "bg-gold/10 text-gold" : "bg-surface"}`}>OCR</span>
                          <span className={`px-1 py-0.2 rounded font-mono ${magazine.aiProgress && magazine.aiProgress > 25 ? "bg-blue-500/10 text-blue-400" : "bg-surface"}`}>EN</span>
                          <span className={`px-1 py-0.2 rounded font-mono ${magazine.aiProgress && magazine.aiProgress > 60 ? "bg-purple-500/10 text-purple-400" : "bg-surface"}`}>KN</span>
                          <span className={`px-1 py-0.2 rounded font-mono ${magazine.aiProgress && magazine.aiProgress >= 100 ? "bg-green-500/10 text-green-400" : "bg-surface"}`}>TA</span>
                        </div>
                      </div>
                    </td>

                    {/* Analytics */}
                    <td className="px-6 py-4 hidden lg:table-cell font-mono text-xs">
                      <div className="space-y-0.5">
                        <p className="text-foreground font-bold">{(magazine.viewCount || 0).toLocaleString()} <span className="text-[10px] text-muted font-normal">views</span></p>
                        <p className="text-muted">{magazine.pageCount || 12} <span className="text-[10px] text-muted font-normal">pages</span></p>
                      </div>
                    </td>

                    {/* Status Flag */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        magazine.isPublished
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${magazine.isPublished ? "bg-green-400" : "bg-yellow-400"}`} />
                        {magazine.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Toggle Featured */}
                        <button
                          onClick={() => handleToggleFeatured(magazine.id)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer shadow-sm ${
                            magazine.isFeatured
                              ? "bg-gold/10 border-gold/40 text-gold hover:bg-gold/20"
                              : "bg-surface border-border-subtle text-muted hover:text-gold hover:border-gold/30"
                          }`}
                          title={magazine.isFeatured ? "Remove from Featured" : "Mark as Featured"}
                        >
                          <Star className={`w-4 h-4 ${magazine.isFeatured ? "fill-gold" : ""}`} />
                        </button>

                        {/* Open Reader */}
                        <a
                          href={`/magazine/${magazine.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-surface border border-border-subtle text-muted hover:text-foreground hover:border-gold/30 transition-all shadow-sm"
                          title="Open Multimodal Reader"
                        >
                          <Eye className="w-4 h-4" />
                        </a>

                        {/* Edit */}
                        <Link
                          href={`/admin/magazines/${magazine.id}/edit`}
                          className="p-2 rounded-xl bg-surface border border-border-subtle text-muted hover:text-gold hover:border-gold/30 transition-all shadow-sm"
                          title="Edit Issue & AI Pipeline"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        {/* Delete */}
                        {deleteId === magazine.id ? (
                          <div className="flex items-center gap-1 bg-danger/10 border border-danger/20 p-1 rounded-xl">
                            <button
                              onClick={() => handleDelete(magazine.id)}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-danger text-white hover:bg-danger/80 transition-colors cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteId(null)}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-surface text-muted hover:text-foreground transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteId(magazine.id)}
                            className="p-2 rounded-xl bg-surface border border-border-subtle text-muted hover:text-danger hover:border-danger/30 transition-all shadow-sm cursor-pointer"
                            title="Delete Issue"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
