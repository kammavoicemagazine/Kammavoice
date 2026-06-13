"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { adminGetAds, deleteAd } from "@/lib/firestore";
import type { Advertisement } from "@/lib/types";


export default function AdsAdminPage() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      const data = await adminGetAds();
      setAds(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this advertisement?")) return;
    try {
      await deleteAd(id);
      setAds(ads.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete ad.");
    }
  };

  const calculateCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return "0.00";
    return ((clicks / impressions) * 100).toFixed(2);
  };

  if (loading) return <div className="p-8">Loading ads...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Advertisements</h1>
          <p className="text-muted-foreground mt-1">Manage banner ads across the platform</p>
        </div>
        <Link
          href="/admin/ads/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Create Ad
        </Link>
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-4 font-medium">Title & Sponsor</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Dates</th>
                <th className="p-4 font-medium text-right">Impressions</th>
                <th className="p-4 font-medium text-right">Clicks</th>
                <th className="p-4 font-medium text-right">CTR (%)</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No advertisements found.
                  </td>
                </tr>
              ) : (
                ads.map((ad) => (
                  <tr key={ad.id} className="border-b hover:bg-muted/30">
                    <td className="p-4">
                      <div className="font-medium text-base">{ad.title}</div>
                      {ad.sponsorName && <div className="text-muted-foreground text-xs">{ad.sponsorName}</div>}
                    </td>
                    <td className="p-4">
                      <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs">
                        {ad.category.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          !ad.isActive ? "bg-red-500" :
                          ad.status === "active" ? "bg-green-500" :
                          ad.status === "scheduled" ? "bg-blue-500" : "bg-gray-500"
                        }`} />
                        <span className="capitalize">{!ad.isActive ? "Disabled" : ad.status}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      <div>{new Date(ad.startDate).toLocaleDateString()}</div>
                      <div>{new Date(ad.endDate).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4 text-right font-medium">{ad.impressions.toLocaleString()}</td>
                    <td className="p-4 text-right font-medium">{ad.clicks.toLocaleString()}</td>
                    <td className="p-4 text-right font-medium text-primary">
                      {calculateCTR(ad.clicks, ad.impressions)}%
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/ads/${ad.id}/edit`}
                          className="p-2 text-muted-foreground hover:text-primary rounded-md hover:bg-muted"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(ad.id)}
                          className="p-2 text-muted-foreground hover:text-red-500 rounded-md hover:bg-muted"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
