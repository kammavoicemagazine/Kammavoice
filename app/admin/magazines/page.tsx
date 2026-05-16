"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Eye, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllMagazines, deleteMagazine } from "@/lib/firestore";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import type { Magazine } from "@/lib/types";
import Image from "next/image";

export default function AdminMagazinesPage() {
  const { user } = useAuth();
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadMagazines();
    }
  }, [user]);

  const loadMagazines = async () => {
    setLoading(true);
    try {
      const data = await getAllMagazines();
      setMagazines(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load magazines.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMagazine(id);
      setMagazines((prev) => prev.filter((m) => m.id !== id));
      toast.success("Magazine deleted");
    } catch {
      toast.error("Failed to delete magazine");
    } finally {
      setDeleteId(null);
    }
  };

  const filtered = magazines.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.issueDate.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-playfair)]">
            Magazines
          </h1>
          <p className="text-sm text-muted mt-1">
            {magazines.length} issues uploaded
          </p>
        </div>
        <Link href="/admin/magazines/new">
          <Button variant="primary">
            <Plus className="w-4 h-4" /> New Issue
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
          placeholder="Search magazines by title or issue date..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface border border-border-subtle text-sm text-foreground placeholder-muted focus:outline-none focus:border-gold/40 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl bg-surface border border-border-subtle overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-14 w-10 rounded-md" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted text-lg mb-2">
              {search ? "No magazines match your search" : "No magazines uploaded yet"}
            </p>
            {!search && (
              <Link href="/admin/magazines/new">
                <Button variant="outline" size="sm" className="mt-4">
                  <Plus className="w-4 h-4" /> Upload your first issue
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left text-xs text-muted font-medium uppercase tracking-wider px-5 py-3">Cover</th>
                  <th className="text-left text-xs text-muted font-medium uppercase tracking-wider px-5 py-3">Issue Details</th>
                  <th className="text-left text-xs text-muted font-medium uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Volume</th>
                  <th className="text-left text-xs text-muted font-medium uppercase tracking-wider px-5 py-3 hidden md:table-cell">Pages/Views</th>
                  <th className="text-left text-xs text-muted font-medium uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-right text-xs text-muted font-medium uppercase tracking-wider px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((magazine) => (
                  <tr
                    key={magazine.id}
                    className="border-b border-border-subtle last:border-0 hover:bg-surface-hover transition-colors"
                  >
                    <td className="px-5 py-3.5 w-16">
                      <div className="relative w-10 h-14 rounded overflow-hidden bg-surface-hover border border-border-subtle">
                        {magazine.coverImageUrl && (
                          <Image src={magazine.coverImageUrl} alt="Cover" fill className="object-cover" />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium max-w-[250px] truncate">
                        {magazine.title}
                      </p>
                      <p className="text-[11px] text-muted">
                        {magazine.issueDate}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell text-sm text-muted">
                      {magazine.volume}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-sm text-muted">
                      <span className="block">{magazine.pageCount || '-'} pages</span>
                      <span className="text-[11px]">{magazine.viewCount || 0} views</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          magazine.isPublished
                            ? "bg-green-500/10 text-green-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {magazine.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/magazine/${magazine.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all"
                          title="View Reader"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <Link
                          href={`/admin/magazines/${magazine.id}/edit`}
                          className="p-2 rounded-lg text-muted hover:text-gold hover:bg-gold/5 transition-all"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        {deleteId === magazine.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(magazine.id)}
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
                            onClick={() => setDeleteId(magazine.id)}
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
