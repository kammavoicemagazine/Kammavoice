"use client";

import { useState, useEffect } from "react";
import { getPendingAggregatedArticles, updateAggregatedArticleStatus } from "@/lib/firestore";
import type { Article } from "@/lib/types";
import { Loader2, Check, X, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function NewsQueuePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const data = await getPendingAggregatedArticles();
      setArticles(data);
    } catch (error) {
      toast.error("Failed to load queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    setProcessingId(id);
    try {
      await updateAggregatedArticleStatus(id, status);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success(`Article ${status} successfully`);
    } catch (error) {
      toast.error(`Failed to ${status} article`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkAction = async (status: "approved" | "rejected") => {
    if (selectedIds.size === 0) return;
    const confirmMessage = `Are you sure you want to ${status} ${selectedIds.size} articles?`;
    if (!window.confirm(confirmMessage)) return;

    setProcessingId("bulk");
    let successCount = 0;
    
    for (const id of Array.from(selectedIds)) {
      try {
        await updateAggregatedArticleStatus(id, status);
        successCount++;
      } catch (err) {
        console.error(`Failed to ${status} article ${id}`);
      }
    }

    setArticles((prev) => prev.filter((a) => !selectedIds.has(a.id)));
    setSelectedIds(new Set());
    setProcessingId(null);
    
    if (successCount > 0) {
      toast.success(`${successCount} articles ${status}`);
    } else {
      toast.error(`Failed to bulk ${status} articles`);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredArticles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredArticles.map(a => a.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (a.sourceName && a.sourceName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleTriggerCron = async () => {
    toast.info("Triggering news aggregation...");
    try {
      const res = await fetch("/api/cron/aggregate", {
        headers: {
          // If we had a secret, we'd pass it here. For demo, it relies on localhost/env check
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ""}`
        }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Found ${data.saved} new articles!`);
        fetchArticles();
      } else {
        toast.error("Aggregation failed");
      }
    } catch (error) {
      toast.error("Network error during aggregation");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-playfair)]">
            AI News Queue
          </h1>
          <p className="text-sm text-muted mt-1">
            Review and approve automated community news before they go live.
          </p>
        </div>
        <button
          onClick={handleTriggerCron}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-border-subtle rounded-lg text-sm font-medium hover:text-gold transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Fetch Now
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface border border-border-subtle p-4 rounded-xl">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search pending articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 rounded-lg bg-[#0A0A0A] border border-border-subtle text-sm focus:border-gold/50 focus:outline-none"
          />
        </div>
        
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-sm text-muted">{selectedIds.size} selected</span>
            <button
              onClick={() => handleBulkAction("approved")}
              disabled={processingId === "bulk"}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg text-sm font-medium hover:bg-green-500/20"
            >
              Approve All
            </button>
            <button
              onClick={() => handleBulkAction("rejected")}
              disabled={processingId === "bulk"}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/20"
            >
              Reject All
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-border-subtle rounded-xl">
          <p className="text-muted mb-2">No pending articles in the queue.</p>
          <button onClick={handleTriggerCron} className="text-gold hover:underline text-sm">
            Trigger aggregator
          </button>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-border-subtle rounded-xl">
          <p className="text-muted mb-2">No pending articles match your search.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Select All Checkbox */}
          <div className="flex items-center gap-3 px-2">
            <input 
              type="checkbox" 
              checked={selectedIds.size === filteredArticles.length && filteredArticles.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-border-subtle accent-gold"
            />
            <span className="text-sm text-muted">Select All</span>
          </div>

          {filteredArticles.map((article) => (
            <div key={article.id} className={`bg-surface border ${selectedIds.has(article.id) ? 'border-gold/50' : 'border-border-subtle'} rounded-xl p-5 flex flex-col md:flex-row gap-6 relative transition-colors`}>
              <div className="absolute top-5 left-5 z-10">
                <input 
                  type="checkbox" 
                  checked={selectedIds.has(article.id)}
                  onChange={() => toggleSelect(article.id)}
                  className="w-4 h-4 rounded border-border-subtle accent-gold"
                />
              </div>
              {/* Thumbnail */}
              <div className="relative w-full md:w-48 aspect-video rounded-lg overflow-hidden shrink-0 bg-black ml-8 md:ml-0">
                {article.imageUrl ? (
                  <Image src={article.imageUrl} alt="" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted text-xs">No Image</div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-white leading-tight">
                      {article.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted">
                      <span className="text-gold">{article.sourceName}</span>
                      <span>•</span>
                      <span>Score: {article.importanceScore}/10</span>
                      {article.isBreaking && (
                        <>
                          <span>•</span>
                          <span className="text-red-400 font-medium">Breaking</span>
                        </>
                      )}
                      <span>•</span>
                      <a 
                        href={article.sourceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Source <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#111] rounded-lg border border-border-subtle/50 text-sm text-[#ccc] leading-relaxed">
                  <span className="text-gold/50 text-xs font-mono uppercase tracking-wider block mb-1">AI Summary</span>
                  {article.excerpt}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {article.tags?.map(t => (
                    <span key={t} className="px-2 py-1 bg-surface-light rounded text-[10px] uppercase text-muted">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex md:flex-col gap-3 shrink-0">
                <button
                  onClick={() => handleAction(article.id, "approved")}
                  disabled={processingId === article.id}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg text-sm font-medium hover:bg-green-500/20 transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" /> Approve
                </button>
                <button
                  onClick={() => handleAction(article.id, "rejected")}
                  disabled={processingId === article.id}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
