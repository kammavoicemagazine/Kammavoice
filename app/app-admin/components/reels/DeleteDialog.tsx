// components/reels/DeleteDialog.tsx
"use client";

import { db, storage } from "@/lib/firebase";
import { deleteDoc, doc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  reel: {
    id: string;
    title: string;
    thumbnailStoragePath?: string;
    videoStoragePath?: string;
  };
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteDialog({ reel, onClose, onDeleted }: Props) {
  const handleDelete = async () => {
    try {
      // Delete Firestore document
      await deleteDoc(doc(db, "app_reels", reel.id));
      // Delete storage files if paths provided
      const deletions = [];
      if (reel.thumbnailStoragePath) {
        deletions.push(deleteObject(ref(storage, reel.thumbnailStoragePath)));
      }
      if (reel.videoStoragePath) {
        deletions.push(deleteObject(ref(storage, reel.videoStoragePath)));
      }
      await Promise.all(deletions);
      onDeleted();
    } catch (err) {
      console.error(err);
      alert((err as any).message || "Failed to delete reel");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#050505] border border-border-subtle shadow-xl overflow-hidden p-6 text-center">
        <AlertCircle className="w-10 h-10 text-danger mx-auto mb-4" />
        <h3 className="text-lg font-bold text-foreground">Delete Reel</h3>
        <p className="text-xs text-muted leading-relaxed mt-2 mb-6">
          Are you sure you want to permanently delete this reel? This will remove the Firestore document and both files from Firebase Storage.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button type="button" onClick={onClose} variant="ghost" size="sm">
            Cancel
          </Button>
          <Button type="button" onClick={handleDelete} className="bg-danger text-white hover:bg-danger/80" size="sm">
            Confirm Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
