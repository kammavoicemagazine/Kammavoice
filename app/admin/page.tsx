"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Eye, Image as ImageIcon, Megaphone, TrendingUp, ArrowUpRight, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllArticles, getCategories, seedCategories } from "@/lib/firestore";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import type { Article } from "@/lib/types";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const arts = await getAllArticles();
      setArticles(arts);
    } catch (err) {
      console.error(err);
      // Don't show error toast on initial load — Firebase might not be configured
    } finally {
      setLoading(false);
    }
  };

  const handleSeedCategories = async () => {
    setSeeding(true);
    try {
      await seedCategories();
      toast.success("Default categories seeded!");
    } catch {
      toast.error("Failed to seed categories. Check Firebase config.");
    } finally {
      setSeeding(false);
    }
  };

  const totalViews = articles.reduce((sum, a) => sum + (a.viewCount || 0), 0);
  const publishedCount = articles.filter((a) => a.isPublished).length;

  const STATS = [
    { label: "Total Articles", value: String(articles.length), icon: FileText, color: "text-gold" },
    { label: "Total Views", value: totalViews > 1000 ? `${(totalViews / 1000).toFixed(1)}K` : String(totalViews), icon: Eye, color: "text-green-400" },
    { label: "Published", value: String(publishedCount), icon: ImageIcon, color: "text-blue-400" },
    { label: "Drafts", value: String(articles.length - publishedCount), icon: Megaphone, color: "text-orange-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-playfair)]">
            Dashboard
          </h1>
          <p className="text-sm text-muted mt-1">
            Welcome back, {user?.email?.split("@")[0] || "Admin"}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={handleSeedCategories} disabled={seeding}>
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Seed Categories
          </Button>
          <Link href="/admin/articles/new">
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4" /> New Article
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="p-5 rounded-xl bg-surface border border-border-subtle hover:border-gold/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent Articles */}
      <div className="rounded-xl bg-surface border border-border-subtle">
        <div className="flex items-center justify-between p-5 border-b border-border-subtle">
          <h2 className="text-lg font-bold">Recent Articles</h2>
          <Link href="/admin/articles">
            <Button variant="ghost" size="sm">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted mb-2">No articles yet</p>
            <Link href="/admin/articles/new">
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4" /> Create your first article
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left text-xs text-muted font-medium uppercase tracking-wider px-5 py-3">Title</th>
                  <th className="text-left text-xs text-muted font-medium uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Category</th>
                  <th className="text-left text-xs text-muted font-medium uppercase tracking-wider px-5 py-3 hidden md:table-cell">Date</th>
                  <th className="text-left text-xs text-muted font-medium uppercase tracking-wider px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {articles.slice(0, 5).map((article) => (
                  <tr key={article.id} className="border-b border-border-subtle last:border-0 hover:bg-surface-hover transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium max-w-[250px] truncate">
                      <Link href={`/admin/articles/${article.id}/edit`} className="hover:text-gold transition-colors">
                        {article.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <Badge>{article.category}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted hidden md:table-cell">
                      {formatDate(article.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        article.isPublished ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                      }`}>
                        {article.isPublished ? "Published" : "Draft"}
                      </span>
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
