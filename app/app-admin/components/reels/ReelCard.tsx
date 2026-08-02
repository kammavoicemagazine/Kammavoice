// components/reels/ReelCard.tsx
"use client";

import { Edit2, Trash2 } from "lucide-react";

type Reel = {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  published: boolean;
  createdAt: any;
};

interface ReelCardProps {
  reel: Reel;
  onEdit: (reel: Reel) => void;
  onDelete: (reel: Reel) => void;
}

export default function ReelCard({ reel, onEdit, onDelete }: ReelCardProps) {
  return (
    <tr className="hover:bg-[#0A0A0A]/40 transition-colors">
      <td className="p-4">
        {reel.thumbnailUrl ? (
          <img src={reel.thumbnailUrl} alt="thumb" className="w-12 h-12 object-cover rounded" />
        ) : (
          <div className="w-12 h-12 rounded bg-gold/10 flex items-center justify-center text-gold text-xs">No Image</div>
        )}
      </td>
      <td className="p-4 font-medium text-foreground">{reel.title}</td>
      <td className="p-4 text-muted text-xs line-clamp-2 max-w-xs">{reel.description || "—"}</td>
      <td className="p-4">
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          reel.published ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-gold/10 text-gold border border-gold/20"
        }`}>
          {reel.published ? "Published" : "Draft"}
        </span>
      </td>
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => onEdit(reel)} className="p-1.5 rounded-lg text-muted hover:text-gold hover:bg-[#0A0A0A] transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(reel)} className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
