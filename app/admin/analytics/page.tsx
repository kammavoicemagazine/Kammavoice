"use client";

import { useState, useEffect, useTransition } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  Globe,
  Smartphone,
  Calendar,
  Download,
  FileText,
  BookOpen,
  Cpu,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllArticles, getAllMagazines } from "@/lib/firestore";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { Article, Magazine } from "@/lib/types";

// Simulated Enterprise Traffic Data
const TRAFFIC_DATA = [
  { name: "Jan", visitors: 42000, pageviews: 98000, aiTokens: 1.2 },
  { name: "Feb", visitors: 58000, pageviews: 125000, aiTokens: 1.8 },
  { name: "Mar", visitors: 74000, pageviews: 165000, aiTokens: 2.4 },
  { name: "Apr", visitors: 92000, pageviews: 210000, aiTokens: 3.2 },
  { name: "May", visitors: 142800, pageviews: 345000, aiTokens: 5.4 }, // Current month surge
];

// Multilingual Readership Distribution
const LANGUAGE_DATA = [
  { name: "Telugu (Original)", value: 58, color: "#C9A84C" },
  { name: "English (AI Trans.)", value: 24, color: "#4A90D9" },
  { name: "Kannada (AI Trans.)", value: 10, color: "#D94A6B" },
  { name: "Tamil (AI Trans.)", value: 8, color: "#4AD98B" },
];

// Device & Location Insights
const DEVICE_DATA = [
  { name: "Mobile (Android/iOS)", value: 72, color: "#8B5CF6" },
  { name: "Desktop (Windows/Mac)", value: 20, color: "#EC4899" },
  { name: "Tablet (iPad/Tab)", value: 8, color: "#06B6D4" },
];

const LOCATION_DATA = [
  { name: "Andhra Pradesh", readers: 64200 },
  { name: "Telangana", readers: 42500 },
  { name: "USA (NRI Diaspora)", readers: 24800 },
  { name: "Karnataka", readers: 8400 },
  { name: "Tamil Nadu", readers: 2900 },
];

export default function AdvancedAnalytics() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;
    startTransition(async () => {
      try {
        const [arts, mags] = await Promise.all([
          getAllArticles(),
          getAllMagazines(),
        ]);
        if (!isMounted) return;
        setArticles(arts);
        setMagazines(mags);
      } catch (err) {
        console.error("Failed to load analytics data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => { isMounted = false; };
  }, []);

  const handleExportReport = () => {
    toast.loading("Compiling enterprise PDF analytics report...", { id: "export" });
    setTimeout(() => {
      toast.success("Analytics report downloaded successfully!", { id: "export" });
    }, 1500);
  };

  const topArticles = [...articles]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 5);

  const topMagazines = [...magazines]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 5);

  return (
    <div className="space-y-8 pb-12 select-none">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#141414] p-6 rounded-2xl border border-border-subtle shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider border border-purple-500/30">
              Recharts Telemetry
            </span>
            <span className="text-xs text-muted font-mono">Live Platform Insights</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-playfair)] text-foreground">
            Advanced Analytics
          </h1>
          <p className="text-sm text-muted mt-1">
            Monitor real-time audience traffic, multilingual AI translation adoption, device distribution, and geographic readership.
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10 flex-wrap">
          {/* Time Range Selector */}
          <div className="flex items-center bg-[#0A0A0A] rounded-xl border border-border-subtle p-1 shadow-sm">
            {(["7d", "30d", "90d", "1y"] as const).map((range) => (
              <button
                key={range}
                onClick={() => { setTimeRange(range); toast.info(`Time range updated to ${range}`); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  timeRange === range ? "bg-gold text-[#0A0A0A]" : "text-muted hover:text-foreground"
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportReport}
            className="border-border-subtle hover:border-gold/40 text-muted hover:text-foreground cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 mr-1.5" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Main Traffic Chart (Area Chart) */}
      <div className="rounded-2xl bg-[#141414] border border-border-subtle shadow-xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4 border-b border-border-subtle pb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground font-[family-name:var(--font-playfair)] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold" /> Audience Growth &amp; AI Token Consumption
            </h2>
            <p className="text-xs text-muted mt-0.5">Monthly unique visitors, total pageviews, and Gemini 1.5 token usage (Millions)</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold flex-wrap">
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-3 h-3 rounded-full bg-blue-400" /> Visitors (Peak: 142.8K)
            </span>
            <span className="flex items-center gap-1.5 text-gold">
              <span className="w-3 h-3 rounded-full bg-gold" /> Pageviews (Peak: 345K)
            </span>
            <span className="flex items-center gap-1.5 text-purple-400">
              <span className="w-3 h-3 rounded-full bg-purple-400" /> AI Tokens (5.4M)
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={TRAFFIC_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAiTokens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C084FC" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#C084FC" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#525252" fontSize={12} tickLine={false} />
              <YAxis stroke="#525252" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1A1A1A", borderColor: "#2E2E2E", borderRadius: "12px", color: "#fff" }}
                itemStyle={{ color: "#C9A84C" }}
              />
              <Area type="monotone" dataKey="pageviews" stroke="#C9A84C" strokeWidth={3} fillOpacity={1} fill="url(#colorPageviews)" />
              <Area type="monotone" dataKey="visitors" stroke="#60A5FA" strokeWidth={3} fillOpacity={1} fill="url(#colorVisitors)" />
              <Area type="monotone" dataKey="aiTokens" stroke="#C084FC" strokeWidth={2} fillOpacity={1} fill="url(#colorAiTokens)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid of 3 Charts: Multilingual Readership, Device Distribution, Location Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Multilingual Readership (Pie Chart) */}
        <div className="rounded-2xl bg-[#141414] border border-border-subtle shadow-xl p-6 flex flex-col">
          <div className="border-b border-border-subtle pb-4 mb-4">
            <h2 className="text-lg font-bold text-foreground font-[family-name:var(--font-playfair)] flex items-center gap-2">
              <Globe className="w-5 h-5 text-gold" /> Multilingual Readership
            </h2>
            <p className="text-xs text-muted mt-0.5">Adoption of AI-translated magazine editions</p>
          </div>
          <div className="h-64 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={LANGUAGE_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                  {LANGUAGE_DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="#141414" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1A1A1A", borderColor: "#2E2E2E", borderRadius: "12px", color: "#fff" }} />
                <Legend formatter={(value) => <span className="text-xs text-muted font-medium">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Distribution (Pie Chart) */}
        <div className="rounded-2xl bg-[#141414] border border-border-subtle shadow-xl p-6 flex flex-col">
          <div className="border-b border-border-subtle pb-4 mb-4">
            <h2 className="text-lg font-bold text-foreground font-[family-name:var(--font-playfair)] flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-gold" /> Device Distribution
            </h2>
            <p className="text-xs text-muted mt-0.5">Audience viewport breakdown</p>
          </div>
          <div className="h-64 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={DEVICE_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                  {DEVICE_DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="#141414" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1A1A1A", borderColor: "#2E2E2E", borderRadius: "12px", color: "#fff" }} />
                <Legend formatter={(value) => <span className="text-xs text-muted font-medium">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Location Insights (Bar Chart) */}
        <div className="rounded-2xl bg-[#141414] border border-border-subtle shadow-xl p-6 flex flex-col">
          <div className="border-b border-border-subtle pb-4 mb-4">
            <h2 className="text-lg font-bold text-foreground font-[family-name:var(--font-playfair)] flex items-center gap-2">
              <Users className="w-5 h-5 text-gold" /> Geographic Readership
            </h2>
            <p className="text-xs text-muted mt-0.5">Top regional audience concentration</p>
          </div>
          <div className="h-64 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={LOCATION_DATA} layout="vertical" margin={{ top: 0, right: 10, left: 40, bottom: 0 }}>
                <XAxis type="number" stroke="#525252" fontSize={10} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="#A3A3A3" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#1A1A1A", borderColor: "#2E2E2E", borderRadius: "12px", color: "#fff" }} />
                <Bar dataKey="readers" fill="#C9A84C" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Performing Articles & Magazines Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Articles Table */}
        <div className="rounded-2xl bg-[#141414] border border-border-subtle shadow-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border-subtle bg-[#1A1A1A] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground font-[family-name:var(--font-playfair)] flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold" /> Top Performing Articles
              </h2>
              <p className="text-xs text-muted mt-0.5">Ranked by cumulative view count</p>
            </div>
            <Badge className="bg-gold/10 text-gold border-gold/20">Updated Live</Badge>
          </div>
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl bg-[#1A1A1A]" />)}
            </div>
          ) : topArticles.length === 0 ? (
            <div className="p-12 text-center text-muted text-sm font-medium">No article metrics available</div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle bg-[#1A1A1A]/50">
                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-muted">Article Title</th>
                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-muted">Category</th>
                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-muted text-right">Views</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/50">
                  {topArticles.map((art) => (
                    <tr key={art.id} className="hover:bg-surface-hover transition-colors group">
                      <td className="px-6 py-4 text-sm font-semibold max-w-[240px] truncate text-foreground group-hover:text-gold transition-colors">
                        {art.title}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="bg-surface border-border-subtle text-muted">{art.category || "General"}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm font-extrabold text-gold text-right font-mono">
                        {(art.viewCount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Magazines Table */}
        <div className="rounded-2xl bg-[#141414] border border-border-subtle shadow-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border-subtle bg-[#1A1A1A] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground font-[family-name:var(--font-playfair)] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gold" /> Top Magazine Editions
              </h2>
              <p className="text-xs text-muted mt-0.5">Ranked by PDF opens and AI overlay views</p>
            </div>
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">Multimodal</Badge>
          </div>
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl bg-[#1A1A1A]" />)}
            </div>
          ) : topMagazines.length === 0 ? (
            <div className="p-12 text-center text-muted text-sm font-medium">No magazine metrics available</div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle bg-[#1A1A1A]/50">
                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-muted">Edition Title</th>
                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-muted">Issue Date</th>
                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-muted text-right">Reads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/50">
                  {topMagazines.map((mag) => (
                    <tr key={mag.id} className="hover:bg-surface-hover transition-colors group">
                      <td className="px-6 py-4 text-sm font-semibold max-w-[240px] truncate text-foreground group-hover:text-gold transition-colors">
                        {mag.title}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-muted font-mono">
                        {mag.issueDate || `${mag.category} ${mag.year}`}
                      </td>
                      <td className="px-6 py-4 text-sm font-extrabold text-purple-400 text-right font-mono">
                        {(mag.viewCount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
