"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import RichTextEditor from "@/components/ui/editor";
import ImageUploader from "@/components/ui/image-uploader";
import { createArticle, updateArticle } from "@/lib/firestore";
import { getCategories } from "@/lib/firestore";
import { slugify, readingTime } from "@/lib/utils";
import type { Article, Category } from "@/lib/types";

interface ArticleFormProps {
  article?: Article | null;
  mode: "create" | "edit";
}

export default function ArticleForm({ article, mode }: ArticleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form state
  const [title, setTitle] = useState(article?.title || "");
  const [titleTelugu, setTitleTelugu] = useState(article?.titleTelugu || "");
  const [excerpt, setExcerpt] = useState(article?.excerpt || "");
  const [excerptTelugu, setExcerptTelugu] = useState(article?.excerptTelugu || "");
  const [content, setContent] = useState(article?.content || "");
  const [category, setCategory] = useState(article?.category || "");
  const [categoryTelugu, setCategoryTelugu] = useState(article?.categoryTelugu || "");
  const [imageUrl, setImageUrl] = useState(article?.imageUrl || "");
  const [imagePublicId, setImagePublicId] = useState(article?.imagePublicId || "");
  const [tags, setTags] = useState(article?.tags?.join(", ") || "");
  const [isFeatured, setIsFeatured] = useState(article?.isFeatured || false);
  const [isBreaking, setIsBreaking] = useState(article?.isBreaking || false);
  const [isPublished, setIsPublished] = useState(article?.isPublished ?? true);
  const [authorName, setAuthorName] = useState(article?.author?.name || "");
  const [authorRole, setAuthorRole] = useState(article?.author?.role || "");

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {
        // Fallback categories if Firestore not configured
        setCategories([
          { id: "politics", name: "Politics", nameTelugu: "రాజకీయాలు", slug: "politics", articleCount: 0 },
          { id: "community", name: "Community", nameTelugu: "సమాజం", slug: "community", articleCount: 0 },
          { id: "culture", name: "Culture", nameTelugu: "సంస్కృతి", slug: "culture", articleCount: 0 },
          { id: "business", name: "Business", nameTelugu: "వ్యాపారం", slug: "business", articleCount: 0 },
          { id: "education", name: "Education", nameTelugu: "విద్య", slug: "education", articleCount: 0 },
          { id: "sports", name: "Sports", nameTelugu: "క్రీడలు", slug: "sports", articleCount: 0 },
        ]);
      });
  }, []);

  // Auto-set Telugu category name when category changes
  useEffect(() => {
    const cat = categories.find((c) => c.slug === category || c.name.toLowerCase() === category.toLowerCase());
    if (cat) setCategoryTelugu(cat.nameTelugu);
  }, [category, categories]);

  const validate = (): boolean => {
    if (!title.trim()) { toast.error("Title is required"); return false; }
    if (!excerpt.trim()) { toast.error("Excerpt is required"); return false; }
    if (!content.trim()) { toast.error("Article content is required"); return false; }
    if (!category.trim()) { toast.error("Category is required"); return false; }
    if (!authorName.trim()) { toast.error("Author name is required"); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const slug = slugify(title);
      const articleData = {
        title,
        titleTelugu: titleTelugu || undefined,
        slug,
        excerpt,
        excerptTelugu: excerptTelugu || undefined,
        content,
        contentTelugu: undefined,
        category: category.toLowerCase(),
        categoryTelugu: categoryTelugu || undefined,
        author: { name: authorName, role: authorRole || undefined },
        imageUrl,
        imagePublicId: imagePublicId || undefined,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        isFeatured,
        isBreaking,
        isPublished,
        readingTime: readingTime(content),
      };

      if (mode === "create") {
        await createArticle(articleData);
        toast.success("Article created successfully!");
      } else if (article?.id) {
        await updateArticle(article.id, articleData);
        toast.success("Article updated successfully!");
      }

      router.push("/admin/articles");
    } catch (err) {
      console.error(err);
      toast.error(mode === "create" ? "Failed to create article" : "Failed to update article");
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
            {mode === "create" ? "New Article" : "Edit Article"}
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

      {/* Title */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Title (English) *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter article title..."
            className={inputClass}
          />
        </div>
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
      </div>

      {/* Excerpt */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Excerpt (English) *</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief summary of the article..."
            rows={3}
            className={inputClass + " resize-none"}
          />
        </div>
        <div>
          <label className={labelClass}>Excerpt (Telugu)</label>
          <textarea
            value={excerptTelugu}
            onChange={(e) => setExcerptTelugu(e.target.value)}
            placeholder="వ్యాసం యొక్క సంక్షిప్త సారాంశం..."
            rows={3}
            className={inputClass + " resize-none"}
          />
        </div>
      </div>

      {/* Cover Image */}
      <ImageUploader
        currentImage={imageUrl}
        onUpload={(url, publicId) => {
          setImageUrl(url);
          setImagePublicId(publicId);
        }}
        onRemove={() => {
          setImageUrl("");
          setImagePublicId("");
        }}
      />

      {/* Content Editor */}
      <div>
        <label className={labelClass}>Content *</label>
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="Write your article content here..."
        />
      </div>

      {/* Meta Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Category *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass + " cursor-pointer"}
          >
            <option value="">Select category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug || cat.name.toLowerCase()}>
                {cat.name} ({cat.nameTelugu})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Author Name *</label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Author name..."
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Author Role</label>
          <input
            type="text"
            value={authorRole}
            onChange={(e) => setAuthorRole(e.target.value)}
            placeholder="e.g. Senior Editor"
            className={inputClass}
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className={labelClass}>Tags (comma-separated)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="politics, hyderabad, community..."
          className={inputClass}
        />
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap gap-6 p-4 rounded-xl bg-surface border border-border-subtle">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="w-4 h-4 rounded border-border-subtle accent-gold"
          />
          <span className="text-sm">Published</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="w-4 h-4 rounded border-border-subtle accent-gold"
          />
          <span className="text-sm">Featured</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isBreaking}
            onChange={(e) => setIsBreaking(e.target.checked)}
            className="w-4 h-4 rounded border-border-subtle accent-gold"
          />
          <span className="text-sm">Breaking News</span>
        </label>
      </div>
    </form>
  );
}
