"use client";

import { useState, useEffect, use } from "react";
import { Loader2 } from "lucide-react";
import ArticleForm from "@/components/admin/ArticleForm";
import { getArticleById } from "@/lib/firestore";
import type { Article } from "@/lib/types";

export default function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getArticleById(id)
      .then((data) => {
        if (data) {
          setArticle(data);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <p className="text-lg text-muted">Article not found</p>
          <p className="text-sm text-muted/60 mt-1">
            The article may have been deleted.
          </p>
        </div>
      </div>
    );
  }

  return <ArticleForm article={article} mode="edit" />;
}
