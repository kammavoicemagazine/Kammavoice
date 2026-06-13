"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createAd, updateAd, adminGetAds } from "@/lib/firestore";
import type { Advertisement, AdCategory, AdStatus } from "@/lib/types";
import { Save, X, Image as ImageIcon } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface Props {
  mode: "create" | "edit";
  id?: string;
}

export default function AdForm({ mode, id }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Advertisement>>({
    title: "",
    imageUrl: "",
    linkUrl: "",
    category: "homepage_banner",
    status: "scheduled",
    sponsorName: "",
    contactNumber: "",
    notes: "",
    isActive: true,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (mode === "edit" && id) {
      loadAd();
    }
  }, [mode, id]);

  const loadAd = async () => {
    try {
      const docRef = doc(db, "ads", id!);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as Advertisement;
        setFormData({
          ...data,
          startDate: new Date(data.startDate).toISOString().slice(0, 10),
          endDate: new Date(data.endDate).toISOString().slice(0, 10),
        });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load ad details.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "kammavoice");

      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (data.secure_url) {
        setFormData(prev => ({ ...prev, imageUrl: data.secure_url }));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ensure we store proper ISO dates for precise querying
      const submissionData = {
        ...formData,
        startDate: new Date(formData.startDate as string).toISOString(),
        endDate: new Date(formData.endDate as string).toISOString(),
      };

      if (mode === "create") {
        await createAd(submissionData as any);
      } else if (id) {
        await updateAd(id, submissionData);
      }
      router.push("/admin/ads");
    } catch (err) {
      console.error(err);
      alert("Failed to save advertisement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{mode === "create" ? "Create New Ad" : "Edit Advertisement"}</h1>
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-muted rounded-full"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg border shadow-sm space-y-4">
              <h2 className="text-xl font-semibold mb-4">Ad Details</h2>
              
              <div>
                <label className="block text-sm font-medium mb-1">Title (Internal reference)</label>
                <input
                  required
                  type="text"
                  value={formData.title || ""}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border rounded-md bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sponsor / Company Name</label>
                <input
                  required
                  type="text"
                  value={formData.sponsorName || ""}
                  onChange={e => setFormData(prev => ({ ...prev, sponsorName: e.target.value }))}
                  className="w-full p-2 border rounded-md bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Target URL</label>
                <input
                  required
                  type="url"
                  value={formData.linkUrl || ""}
                  onChange={e => setFormData(prev => ({ ...prev, linkUrl: e.target.value }))}
                  className="w-full p-2 border rounded-md bg-background"
                  placeholder="https://"
                />
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border shadow-sm space-y-4">
              <h2 className="text-xl font-semibold mb-4">Banner Creative</h2>
              <div className="border-2 border-dashed rounded-lg p-8 text-center relative hover:bg-muted/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                {uploading ? (
                  <div className="text-muted-foreground">Uploading...</div>
                ) : formData.imageUrl ? (
                  <div className="space-y-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={formData.imageUrl} alt="Ad Preview" className="max-h-48 mx-auto rounded-md object-contain" />
                    <div className="text-sm text-primary">Click to change image</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ImageIcon className="w-8 h-8" />
                    <span>Upload Banner Image</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg border shadow-sm space-y-4">
              <h2 className="text-xl font-semibold mb-4">Targeting & Schedule</h2>
              
              <div>
                <label className="block text-sm font-medium mb-1">Placement Category</label>
                <select
                  value={formData.category || "homepage_banner"}
                  onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as AdCategory }))}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="homepage_banner">Homepage Banner</option>
                  <option value="magazine_banner">Magazine Banner (Reader Bottom)</option>
                  <option value="article_banner">Article Banner</option>
                  <option value="half_page">Half Page Ad</option>
                  <option value="full_page">Full Page Ad</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={formData.status || "scheduled"}
                  onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as AdStatus }))}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="active">Active (Live immediately)</option>
                  <option value="scheduled">Scheduled (Wait for start date)</option>
                  <option value="expired">Expired / Ended</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm font-medium">Enable Ad Delivery</label>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate as string}
                    onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full p-2 border rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate as string}
                    onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full p-2 border rounded-md bg-background"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border shadow-sm space-y-4">
              <h2 className="text-xl font-semibold mb-4">Additional Info</h2>
              
              <div>
                <label className="block text-sm font-medium mb-1">Contact Number (Optional)</label>
                <input
                  type="tel"
                  value={formData.contactNumber || ""}
                  onChange={e => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                  className="w-full p-2 border rounded-md bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Internal Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes || ""}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-2 border rounded-md bg-background resize-none"
                  placeholder="Pricing, special instructions..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border rounded-md hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || uploading || !formData.imageUrl}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : mode === "create" ? "Create Advertisement" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
