// components/reels/ReelForm.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

import FileUploader from "@/app/app-admin/components/FileUploader"; // Assuming component path
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export interface ReelFormProps {
  type: "create" | "edit";
  reel?: any; // existing reel data when editing
  onClose: () => void;
  onSaved: () => void; // callback to refresh list
}

export default function ReelForm({ type, reel, onClose, onSaved }: ReelFormProps) {
  const [formData, setFormData] = useState({
    title: reel?.title || "",
    description: reel?.description || "",
    thumbnailUrl: reel?.thumbnailUrl || "",
    videoUrl: reel?.videoUrl || "",
    thumbnailStoragePath: reel?.thumbnailStoragePath || "",
    videoStoragePath: reel?.videoStoragePath || "",
    published: reel?.published ?? true,
  });

  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.thumbnailUrl || !formData.videoUrl) {
      alert("Title, thumbnail and video are required");
      return;
    }
    try {
      if (type === "create") {
        await addDoc(collection(db, "app_reels"), {
          title: formData.title.trim(),
          description: formData.description.trim(),
          thumbnailUrl: formData.thumbnailUrl,
          videoUrl: formData.videoUrl,
          thumbnailStoragePath: formData.thumbnailStoragePath,
          videoStoragePath: formData.videoStoragePath,
          published: !!formData.published,
          createdAt: serverTimestamp(),
        });
      } else if (type === "edit" && reel?.id) {
        await updateDoc(doc(db, "app_reels", reel.id), {
          title: formData.title.trim(),
          description: formData.description.trim(),
          thumbnailUrl: formData.thumbnailUrl,
          videoUrl: formData.videoUrl,
          thumbnailStoragePath: formData.thumbnailStoragePath,
          videoStoragePath: formData.videoStoragePath,
          published: !!formData.published,
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save reel");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
      <div>
        <label className="block text-xs font-semibold uppercase text-muted mb-1.5">Reel Title *</label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-[#000] border border-border-subtle text-sm text-foreground placeholder-muted focus:outline-none focus:border-gold/40"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase text-muted mb-1.5">Description</label>
        <textarea
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-[#000] border border-border-subtle text-sm text-foreground placeholder-muted focus:outline-none focus:border-gold/40"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FileUploader
          label="Thumbnail Image *"
          accept="image/*"
          folder="app-reels/thumbnails"
          currentUrl={formData.thumbnailUrl}
          onUploadComplete={(url, path) => {
            setFormData({ ...formData, thumbnailUrl: url, thumbnailStoragePath: path || "" });
          }}
          onRemove={() => setFormData({ ...formData, thumbnailUrl: "", thumbnailStoragePath: "" })}
        />
        <FileUploader
          label="Video MP4 *"
          accept="video/mp4"
          folder="app-reels/videos"
          currentUrl={formData.videoUrl}
          onUploadComplete={(url, path) => {
            setFormData({ ...formData, videoUrl: url, videoStoragePath: path || "" });
          }}
          onRemove={() => setFormData({ ...formData, videoUrl: "", videoStoragePath: "" })}
        />
      </div>
      <div className="flex items-center gap-2 mt-4">
        <input
          type="checkbox"
          id="reelPublished"
          checked={!!formData.published}
          onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
          className="w-4 h-4 rounded border-border-subtle accent-gold cursor-pointer"
        />
        <label htmlFor="reelPublished" className="text-xs text-foreground font-semibold cursor-pointer select-none">
          Published (visible in app)
        </label>
      </div>
      <div className="pt-4 border-t border-border-subtle flex items-center justify-end gap-3 bg-[#0A0A0A] -mx-6 -mb-6 p-6">
        <Button type="button" onClick={onClose} variant="ghost" className="text-xs">Cancel</Button>
        <Button type="submit" variant="primary" className="bg-gold text-[#000] text-xs font-bold">
          {type === "create" ? "Create Reel" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
