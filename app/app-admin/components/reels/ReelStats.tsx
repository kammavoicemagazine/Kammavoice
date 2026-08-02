// components/reels/ReelStats.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

interface Reel {
  id: string;
  title: string;
  published: boolean;
  createdAt: any;
}

export default function ReelStats() {
  const [stats, setStats] = useState({ total: 0, published: 0, latest: null as Reel | null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "app_reels"), orderBy("createdAt", "desc")),
      (snap) => {
        const reels = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reel));
        const total = reels.length;
        const published = reels.filter((r) => r.published).length;
        const latest = reels[0] || null;
        setStats({ total, published, latest });
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-muted">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading Reel stats...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="p-6 rounded-2xl bg-[#050505] border border-border-subtle flex flex-col gap-1 shadow-md">
        <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Total Reels</span>
        <span className="text-4xl font-extrabold text-foreground">{stats.total}</span>
      </div>
      <div className="p-6 rounded-2xl bg-[#050505] border border-border-subtle flex flex-col gap-1 shadow-md">
        <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Published</span>
        <span className="text-4xl font-extrabold text-foreground">{stats.published}</span>
      </div>
      <div className="p-6 rounded-2xl bg-[#050505] border border-border-subtle flex flex-col gap-1 shadow-md">
        <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Latest Reel</span>
        <span className="text-sm text-foreground truncate">
          {stats.latest ? stats.latest.title : "—"}
        </span>
      </div>
    </div>
  );
}
