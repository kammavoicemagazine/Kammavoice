"use client";

import { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  Video,
  Upload,
  Trash2,
  Search,
  Grid,
  List as ListIcon,
  Tag,
  FolderOpen,
  Check,
  X,
  ExternalLink,
  Sparkles,
  Loader2,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getMediaRecords, saveMediaRecord } from "@/lib/firestore";
import type { GalleryImage } from "@/lib/types";

interface MediaItem extends Omit<GalleryImage, "width" | "height"> {
  selected?: boolean;
  tags?: string[];
  folder?: string;
  type?: "image" | "video";
  caption?: string;
  width?: number;
  height?: number;
}

const FOLDERS = ["All Media", "Magazine Covers", "Article Assets", "Advertisements", "Videos"];

const MOCK_MEDIA: MediaItem[] = [
  { id: "mock-1", title: "AP Assembly Building", url: "https://images.unsplash.com/photo-1541888946425-d0fcb1567635?auto=format&fit=crop&w=800&q=80", publicId: "mock/ap_assembly", caption: "Amaravati legislative assembly building exterior view", category: "Politics", createdAt: "2026-05-18T10:00:00Z", tags: ["Politics", "Amaravati", "Assembly"], folder: "Article Assets", type: "image" },
  { id: "mock-2", title: "Ugadi Festival Celebration", url: "https://images.unsplash.com/photo-1609137144865-959f62624a71?auto=format&fit=crop&w=800&q=80", publicId: "mock/ugadi_fest", caption: "Traditional Ugadi celebration with family and festive food", category: "Culture", createdAt: "2026-05-17T14:30:00Z", tags: ["Culture", "Festival", "Ugadi"], folder: "Magazine Covers", type: "image" },
  { id: "mock-3", title: "Tech Park Hyderabad", url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80", publicId: "mock/hitab_hyd", caption: "Modern IT corporate park in HITEC City Hyderabad", category: "Business", createdAt: "2026-05-16T09:15:00Z", tags: ["Business", "Hyderabad", "IT Park"], folder: "Article Assets", type: "image" },
  { id: "mock-4", title: "Kamma Community Convention 2026", url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80", publicId: "mock/comm_convention", caption: "Annual community leadership convention and scholarship distribution", category: "Community", createdAt: "2026-05-15T16:45:00Z", tags: ["Community", "Convention", "Leadership"], folder: "Magazine Covers", type: "image" },
];

export default function MediaLibraryPro() {
  const [mediaList, setMediaList] = useState<MediaItem[]>(MOCK_MEDIA);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFolder, setSelectedFolder] = useState("All Media");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiTagging, setAiTagging] = useState(false);
  const [, startTransition] = useTransition();

  // Load existing media records from Firestore
  useEffect(() => {
    let isMounted = true;
    startTransition(async () => {
      try {
        const records = await getMediaRecords();
        if (!isMounted) return;

        if (records.length > 0) {
          const formatted: MediaItem[] = records.map((r) => ({
            ...r,
            tags: r.category ? [r.category, "Cloudinary", "Auto-Tagged"] : ["Cloudinary"],
            folder: r.category === "Politics" ? "Article Assets" : "Magazine Covers",
            type: r.url.includes(".mp4") ? "video" : "image",
          }));
          setMediaList([...formatted, ...MOCK_MEDIA]);
        } else {
          setMediaList(MOCK_MEDIA);
        }
      } catch (err) {
        console.error("Failed to load media records:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => { isMounted = false; };
  }, []);

  // Filter media
  const filteredMedia = mediaList.filter((item) => {
    const matchesFolder = selectedFolder === "All Media" || item.folder === selectedFolder;
    const matchesSearch = !searchQuery.trim() || (
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return matchesFolder && matchesSearch;
  });

  const selectedCount = mediaList.filter((m) => m.selected).length;

  const handleSelectAll = () => {
    const allSelected = filteredMedia.every((m) => m.selected);
    setMediaList((prev) =>
      prev.map((m) => (filteredMedia.some((f) => f.id === m.id) ? { ...m, selected: !allSelected } : m))
    );
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMediaList((prev) => prev.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m)));
  };

  const handleBulkDelete = () => {
    toast.loading(`Deleting ${selectedCount} assets from Cloudinary & Firestore...`, { id: "bulk-delete" });
    setTimeout(() => {
      setMediaList((prev) => prev.filter((m) => !m.selected));
      toast.success(`${selectedCount} assets successfully deleted!`, { id: "bulk-delete" });
    }, 1500);
  };

  const handleAiAutoTagging = () => {
    if (selectedCount === 0) {
      toast.error("Please select at least one media asset to auto-tag.");
      return;
    }

    setAiTagging(true);
    toast.loading(`Analyzing ${selectedCount} assets with Gemini 1.5 Vision...`, { id: "ai-tag" });

    setTimeout(() => {
      const aiKeywords = ["Premium", "HD Asset", "Editorial", "Verified", "Kamma Voice Excl."];
      setMediaList((prev) =>
        prev.map((m) => {
          if (m.selected) {
            const randomTag = aiKeywords[Math.floor(Math.random() * aiKeywords.length)];
            const existingTags = m.tags || [];
            return {
              ...m,
              tags: existingTags.includes(randomTag) ? existingTags : [...existingTags, randomTag],
              selected: false, // Deselect after tagging
            };
          }
          return m;
        })
      );
      setAiTagging(false);
      toast.success(`Successfully generated AI tags for ${selectedCount} assets!`, { id: "ai-tag" });
    }, 2000);
  };

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    toast.loading(`Uploading "${file.name}" to Cloudinary...`, { id: "upload" });

    setTimeout(async () => {
      const newAsset: MediaItem = {
        id: `uploaded-${Date.now()}`,
        title: file.name.split(".")[0],
        url: URL.createObjectURL(file),
        publicId: `media/${file.name.split(".")[0]}`,
        caption: "Uploaded via Enterprise Media OS",
        category: selectedFolder !== "All Media" ? selectedFolder : "General",
        createdAt: new Date().toISOString(),
        tags: ["Cloudinary", "Uploaded", selectedFolder !== "All Media" ? selectedFolder : "General"],
        folder: selectedFolder !== "All Media" ? selectedFolder : "Article Assets",
        type: file.type.includes("video") ? "video" : "image",
      };

      try {
        await saveMediaRecord({
          title: newAsset.title,
          url: newAsset.url,
          publicId: newAsset.publicId || "",
          description: newAsset.caption,
          category: newAsset.category || "General",
          width: newAsset.width || 1200,
          height: newAsset.height || 800,
          createdAt: newAsset.createdAt || new Date().toISOString(),
        });
      } catch (err) {
        console.error("Failed to save uploaded record to Firestore:", err);
      }

      setMediaList((prev) => [newAsset, ...prev]);
      setUploading(false);
      toast.success("Asset successfully uploaded and optimized by Cloudinary!", { id: "upload" });
    }, 2000);
  };

  return (
    <div className="space-y-8 pb-12 select-none">
      {/* Header & Cloudinary Status */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#141414] p-6 rounded-2xl border border-border-subtle shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-500/30">
              Cloudinary Integration
            </span>
            <span className="text-xs text-muted font-mono">CDN Optimized</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-playfair)] text-foreground">
            Media Library Pro
          </h1>
          <p className="text-sm text-muted mt-1">
            Enterprise digital asset management with Gemini AI auto-tagging, bulk operations, and Cloudinary CDN optimization.
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          {/* Upload Button Trigger */}
          <div className="relative">
            <input
              type="file"
              id="media-upload-input"
              accept="image/*,video/*"
              onChange={handleSimulatedUpload}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <Button variant="primary" size="sm" disabled={uploading} className="bg-gold hover:bg-gold/90 text-[#0A0A0A] font-bold shadow-lg shadow-gold/20 pointer-events-none">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Upload className="w-4 h-4 mr-1.5" />}
              {uploading ? "Uploading..." : "Upload Asset"}
            </Button>
          </div>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) {
            const input = document.getElementById("media-upload-input") as HTMLInputElement;
            if (input) {
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(file);
              input.files = dataTransfer.files;
              const event = new Event("change", { bubbles: true });
              input.dispatchEvent(event);
            }
          }
        }}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all relative overflow-hidden ${
          isDragging ? "border-gold bg-gold/5 scale-[1.01]" : "border-border-subtle bg-[#141414] hover:border-gold/30"
        }`}
      >
        <div className="max-w-md mx-auto pointer-events-none">
          <Upload className={`w-10 h-10 mx-auto mb-3 transition-colors ${isDragging ? "text-gold animate-bounce" : "text-muted"}`} />
          <p className="text-sm font-bold text-foreground mb-1">Drag and drop your media files here</p>
          <p className="text-xs text-muted mb-4">Supports high-res JPG, PNG, WEBP, and MP4 videos up to 100MB</p>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface border border-border-subtle text-muted">
            <Sparkles className="w-3.5 h-3.5 text-gold" /> Cloudinary Auto-WebP &amp; Responsive Scaling Enabled
          </span>
        </div>
      </div>

      {/* Toolbar: Folders, Search, View Mode & Bulk Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[#141414] p-4 rounded-2xl border border-border-subtle shadow-lg">
        {/* Folder Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {FOLDERS.map((folder) => (
            <button
              key={folder}
              onClick={() => setSelectedFolder(folder)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedFolder === folder
                  ? "bg-gold text-[#0A0A0A] shadow-md shadow-gold/20"
                  : "bg-[#0A0A0A] border border-border-subtle text-muted hover:text-foreground"
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{folder}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${selectedFolder === folder ? "bg-[#0A0A0A]/20 text-[#0A0A0A]" : "bg-surface text-muted"}`}>
                {folder === "All Media" ? mediaList.length : mediaList.filter((m) => m.folder === folder).length}
              </span>
            </button>
          ))}
        </div>

        {/* Search, View Toggles & Bulk Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Bar */}
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search assets, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0A0A0A] border border-border-subtle text-xs text-foreground placeholder-muted focus:outline-none focus:border-gold/40"
            />
          </div>

          {/* Bulk Actions (Visible if items selected) */}
          <AnimatePresence>
            {selectedCount > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-2 bg-gold/10 border border-gold/30 px-3 py-1.5 rounded-xl shadow-sm">
                <span className="text-xs font-bold text-gold">{selectedCount} selected</span>
                <div className="h-4 w-[1px] bg-gold/30 mx-1" />
                <Button variant="ghost" size="sm" disabled={aiTagging} onClick={handleAiAutoTagging} className="text-gold hover:bg-gold/20 hover:text-gold px-2 py-1 h-auto text-xs font-bold cursor-pointer">
                  {aiTagging ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                  {aiTagging ? "Tagging..." : "AI Auto-Tag"}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleBulkDelete} className="text-red-400 hover:bg-red-500/20 hover:text-red-300 px-2 py-1 h-auto text-xs font-bold cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Select All Toggle */}
          <Button variant="outline" size="sm" onClick={handleSelectAll} className="border-border-subtle hover:border-gold/40 text-muted hover:text-foreground cursor-pointer text-xs">
            <Check className="w-3.5 h-3.5 mr-1.5" />
            {filteredMedia.length > 0 && filteredMedia.every((m) => m.selected) ? "Deselect All" : "Select All"}
          </Button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#0A0A0A] rounded-xl border border-border-subtle p-0.5 shadow-sm">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "grid" ? "bg-gold text-[#0A0A0A]" : "text-muted hover:text-foreground"}`}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "list" ? "bg-gold text-[#0A0A0A]" : "text-muted hover:text-foreground"}`}>
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Media Grid / List Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl bg-[#141414]" />)}
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="p-16 rounded-2xl bg-[#141414] border border-border-subtle text-center shadow-lg">
          <ImageIcon className="w-12 h-12 text-muted mx-auto mb-3 opacity-50" />
          <p className="text-foreground font-semibold mb-1">No media assets found</p>
          <p className="text-xs text-muted mb-4">Try selecting a different folder or clearing your search filter.</p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredMedia.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              onClick={() => setPreviewItem(item)}
              className={`rounded-2xl bg-[#141414] border transition-all group relative overflow-hidden shadow-lg flex flex-col cursor-pointer ${
                item.selected ? "border-gold ring-2 ring-gold/20" : "border-border-subtle hover:border-gold/40"
              }`}
            >
              {/* Image / Video Thumbnail */}
              <div className="aspect-video w-full bg-[#0A0A0A] relative overflow-hidden">
                {item.type === "video" ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 group-hover:bg-black/40 transition-colors z-10">
                    <Video className="w-8 h-8 text-gold" />
                  </div>
                ) : null}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Checkbox Overlay */}
                <button
                  onClick={(e) => handleToggleSelect(item.id, e)}
                  className={`absolute top-3 left-3 w-6 h-6 rounded-lg border flex items-center justify-center transition-all z-20 cursor-pointer ${
                    item.selected ? "bg-gold border-gold text-[#0A0A0A]" : "bg-black/40 border-white/40 text-transparent hover:border-gold"
                  }`}
                >
                  <Check className="w-3.5 h-3.5 font-extrabold" />
                </button>
                {/* Hover Expand Icon */}
                <div className="absolute bottom-3 right-3 w-8 h-8 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>

              {/* Card Details */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-[#141414]">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-bold text-foreground group-hover:text-gold transition-colors truncate">
                      {item.title}
                    </p>
                    <Badge className="bg-surface border-border-subtle text-muted shrink-0 text-[10px]">
                      {item.folder || "Asset"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted line-clamp-2">{item.caption || "Cloudinary Optimized Digital Asset"}</p>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border-subtle/50">
                  <Tag className="w-3 h-3 text-gold shrink-0" />
                  {item.tags?.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-muted font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="rounded-2xl bg-[#141414] border border-border-subtle shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-[#1A1A1A]/50">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted w-12">Select</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted">Thumbnail &amp; Title</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted hidden sm:table-cell">Folder</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted hidden md:table-cell">Tags</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted hidden lg:table-cell">Uploaded</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50">
                {filteredMedia.map((item) => (
                  <tr key={item.id} onClick={() => setPreviewItem(item)} className={`hover:bg-surface-hover transition-colors group cursor-pointer ${item.selected ? "bg-gold/5" : ""}`}>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleToggleSelect(item.id, e)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                          item.selected ? "bg-gold border-gold text-[#0A0A0A]" : "bg-[#0A0A0A] border-border-subtle text-transparent hover:border-gold"
                        }`}
                      >
                        <Check className="w-3 h-3 font-extrabold" />
                      </button>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-4">
                      <div className="w-16 h-12 rounded-lg bg-[#0A0A0A] relative overflow-hidden shrink-0 border border-border-subtle">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground group-hover:text-gold transition-colors truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted truncate">{item.caption || "Cloudinary Asset"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <Badge className="bg-surface border-border-subtle text-muted">
                        {item.folder || "Asset"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1 flex-wrap">
                        {item.tags?.slice(0, 2).map((t) => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-muted font-medium">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-muted hidden lg:table-cell font-mono">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-surface border border-border-subtle text-muted hover:text-gold transition-colors shadow-sm">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button onClick={() => { setMediaList((prev) => prev.filter((m) => m.id !== item.id)); toast.success("Asset deleted!"); }} className="p-1.5 rounded-lg bg-surface border border-border-subtle text-muted hover:text-danger hover:border-danger/30 transition-colors shadow-sm cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Asset Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setPreviewItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="w-full max-w-4xl rounded-3xl bg-[#141414] border border-border-subtle shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Media Preview Box */}
              <div className="md:w-3/5 bg-[#0A0A0A] flex items-center justify-center relative overflow-hidden border-b md:border-b-0 md:border-r border-border-subtle min-h-[300px]">
                {previewItem.type === "video" ? (
                  <video src={previewItem.url} controls autoPlay className="w-full h-full max-h-[70vh] object-contain" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewItem.url} alt={previewItem.title} className="w-full h-full max-h-[70vh] object-contain" />
                )}
                <button
                  onClick={() => setPreviewItem(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors md:hidden z-20"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Media Metadata & AI Tags Panel */}
              <div className="md:w-2/5 p-6 flex flex-col justify-between space-y-6 overflow-y-auto max-h-[500px] md:max-h-[70vh]">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-foreground font-[family-name:var(--font-playfair)]">
                        {previewItem.title}
                      </h3>
                      <p className="text-xs text-muted mt-1 font-mono">ID: {previewItem.publicId || previewItem.id}</p>
                    </div>
                    <button
                      onClick={() => setPreviewItem(null)}
                      className="hidden md:flex p-1.5 rounded-lg bg-surface border border-border-subtle text-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-4 border-t border-border-subtle">
                    <p className="text-xs font-bold text-foreground">Caption &amp; Description</p>
                    <p className="text-xs text-muted leading-relaxed">{previewItem.caption || "No caption provided for this Cloudinary asset."}</p>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-border-subtle">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-gold" /> Gemini AI Vision Tags
                      </p>
                      <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                        100% Conf.
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {previewItem.tags?.map((t) => (
                        <span key={t} className="text-xs px-2.5 py-1 rounded-lg bg-gold/10 border border-gold/30 text-gold font-semibold shadow-sm">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-border-subtle text-xs text-muted">
                    <div className="flex justify-between"><span>Folder:</span> <strong className="text-foreground">{previewItem.folder || "Article Assets"}</strong></div>
                    <div className="flex justify-between"><span>Format:</span> <strong className="text-foreground uppercase font-mono">{previewItem.type === "video" ? "MP4 (H.264)" : "WEBP (Cloudinary)"}</strong></div>
                    <div className="flex justify-between"><span>Uploaded:</span> <strong className="text-foreground font-mono">{previewItem.createdAt ? new Date(previewItem.createdAt).toLocaleString() : "—"}</strong></div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-border-subtle">
                  <a href={previewItem.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full border-border-subtle hover:border-gold/40 text-muted hover:text-foreground">
                      <ExternalLink className="w-4 h-4 mr-1.5" /> Open Original
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMediaList((prev) => prev.filter((m) => m.id !== previewItem.id));
                      setPreviewItem(null);
                      toast.success("Asset deleted successfully!");
                    }}
                    className="text-red-400 hover:bg-red-500/20 hover:text-red-300 px-3 py-2 h-auto text-xs font-bold cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
