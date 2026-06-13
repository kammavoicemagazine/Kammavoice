"use client";

import { use } from "react";
import AdForm from "@/components/admin/AdForm";

export default function EditAdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AdForm mode="edit" id={id} />;
}
