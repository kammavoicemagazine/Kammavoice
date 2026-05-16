"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Eye, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllArticles, deleteArticle } from "@/lib/firestore";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import type { Article } from "@/lib/types";

export default function AdminArticlesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadArticles();
    }
  }, [user]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await getAllArticles();
      setArticles(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load articles. Check Firebase config.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteArticle(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      toast.success("Article deleted");
    } catch {
      toast.error("Failed to delete article");
    } finally {
      setDeleteId(null);
    }
  };

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-playfair)]">
            Articles
          </h1>
          <p className="text-sm text-muted mt-1">
            {articles.length} total articles
          </p>
        </div>
        <Link href="/admin/articles/new">
          <Button variant="primary">
            <Plus className="w-4 h-4" /> New Article
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface border border-border-subtle text-sm text-foreground placeholder-muted focus:outline-none focus:border-gold/40 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl bg-surface border border-border-subtle overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted text-lg mb-2">
              {search ? "No articles match your search" : "No articles yet"}
            </p>
            {!search && (
              <Link href="/admin/articles/new">
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4" /> Create your first article
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left text-xs text-muted font-medium uppercase tracking-wider px-5 py-3">
                    Title
                  </th>
                  <th className="text-left text-xs text-muted font-medium uppercase tracking-wider px-5 py-3 hidden sm:table-cell">
                    Category
                  </th>
                  <th className="text-left text-xs text-muted font-medium uppercase tracking-wider px-5 py-3 hidden md:table-cell">
                    Date
                  </th>
                  <th className="text-left text-xs text-muted font-medium uppercase tracking-wider px-5 py-3">
                    Status
                  </th>
                  <th className="text-right text-xs text-muted font-medium uppercase tracking-wider px-5 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((article) => (
                  <tr
                    key={article.id}
                    className="border-b border-border-subtle last:border-0 hover:bg-surface-hover transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium max-w-[300px] truncate">
                        {article.title}
                      </p>
                      {article.titleTelugu && (
                        <p className="text-[11px] text-gold/40 truncate max-w-[300px]">
                          {article.titleTelugu}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <Badge>{article.category}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted hidden md:table-cell">
                      {formatDate(article.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          article.isPublished
                            ? "bg-green-500/10 text-green-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {article.isPublished ? "Published" : "Draft"}
                      </span>
                      {article.isFeatured && (
                        <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gold/10 text-gold">
                          Featured
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/news/${article.slug}`}
                          target="_blank"
                          className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/articles/${article.id}/edit`}
                          className="p-2 rounded-lg text-muted hover:text-gold hover:bg-gold/5 transition-all"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        {deleteId === article.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(article.id)}
                              className="px-2 py-1 text-[11px] rounded bg-danger/20 text-danger hover:bg-danger/30 transition-colors cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteId(null)}
                              className="px-2 py-1 text-[11px] rounded bg-surface-hover text-muted cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteId(article.id)}
                            className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger/5 transition-all cursor-pointer"
                            title="Delete"
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
