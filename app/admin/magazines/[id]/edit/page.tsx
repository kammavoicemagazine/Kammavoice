"use client";

import { useState, useEffect, use } from "react";
import { Loader2 } from "lucide-react";
import MagazineForm from "@/components/admin/MagazineForm";
import { getMagazineById } from "@/lib/firestore";
import type { Magazine } from "@/lib/types";

export default function EditMagazinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [magazine, setMagazine] = useState<Magazine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getMagazineById(id)
      .then((data) => {
        if (data) {
          setMagazine(data);
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

  if (error || !magazine) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <p className="text-lg text-muted">Magazine not found</p>
        </div>
      </div>
    );
  }

  return <MagazineForm magazine={magazine} mode="edit" />;
}
