// components/reels/ReelList.tsx
"use client";

import ReelCard from "./ReelCard";

interface Reel {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  published: boolean;
  createdAt: any;
}

interface Props {
  reels: Reel[];
  onEdit: (reel: Reel) => void;
  onDelete: (reel: Reel) => void;
}

export default function ReelList({ reels, onEdit, onDelete }: Props) {
  if (reels.length === 0) {
    return <p className="text-xs text-muted">No reels have been uploaded yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-[#0A0A0A]">
            <th className="p-4 font-semibold text-muted text-xs uppercase tracking-wider">Thumb</th>
            <th className="p-4 font-semibold text-muted text-xs uppercase tracking-wider">Title / Desc</th>
            <th className="p-4 font-semibold text-muted text-xs uppercase tracking-wider">Uploaded</th>
            <th className="p-4 font-semibold text-muted text-xs uppercase tracking-wider">Status</th>
            <th className="p-4 font-semibold text-muted text-xs uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {reels.map((reel) => (
            <ReelCard key={reel.id} reel={reel} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
