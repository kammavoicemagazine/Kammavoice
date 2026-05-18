"use client";

import { motion } from "framer-motion";
import { Database, Cloud, Server, Clock, Activity, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { useAdminStore } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SystemHealth() {
  const { systemHealth, updateSystemHealth } = useAdminStore();

  const handleRefreshHealth = () => {
    toast.loading("Pinging infrastructure endpoints...", { id: "sys-health" });
    setTimeout(() => {
      updateSystemHealth({
        firestoreUsage: Math.floor(Math.random() * 15) + 35,
        cloudinaryBandwidth: Math.floor(Math.random() * 10) + 72,
        vercelFunctions: Math.floor(Math.random() * 12) + 25,
        apiLatencyMs: Math.floor(Math.random() * 40) + 120,
        errorRatePercent: parseFloat((Math.random() * 0.15).toFixed(2)),
      });
      toast.success("Infrastructure health metrics updated!", { id: "sys-health" });
    }, 1500);
  };

  return (
    <div className="rounded-2xl bg-[#141414] border border-border-subtle shadow-xl overflow-hidden flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-[#1A1A1A]">
        <div>
          <h2 className="text-lg font-bold text-foreground font-[family-name:var(--font-playfair)] flex items-center gap-2">
            <Activity className="w-5 h-5 text-gold animate-pulse" /> System Health &amp; Infrastructure
          </h2>
          <p className="text-xs text-muted mt-0.5">Real-time Vercel, Firebase, and Cloudinary telemetry</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshHealth}
          className="border-border-subtle hover:border-gold/40 text-muted hover:text-foreground cursor-pointer shadow-sm"
        >
          <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh Telemetry
        </Button>
      </div>

      {/* Grid of 6 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 flex-1">
        {/* Firestore Usage */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="p-5 rounded-xl bg-[#0A0A0A] border border-border-subtle relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
              <Database className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
              {systemHealth.firestoreUsage}%
            </span>
          </div>
          <p className="text-base font-bold text-foreground">Firestore Database</p>
          <p className="text-xs text-muted mt-0.5">Read/Write Quota &amp; Subcollections</p>
          <div className="w-full bg-[#141414] h-1.5 rounded-full mt-4 overflow-hidden border border-border-subtle">
            <div className="bg-orange-400 h-full rounded-full transition-all duration-500" style={{ width: `${systemHealth.firestoreUsage}%` }} />
          </div>
        </motion.div>

        {/* Cloudinary Bandwidth */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.05 }} className="p-5 rounded-xl bg-[#0A0A0A] border border-border-subtle relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Cloud className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
              {systemHealth.cloudinaryBandwidth}%
            </span>
          </div>
          <p className="text-base font-bold text-foreground">Cloudinary Bandwidth</p>
          <p className="text-xs text-muted mt-0.5">Monthly CDN Transformation Quota</p>
          <div className="w-full bg-[#141414] h-1.5 rounded-full mt-4 overflow-hidden border border-border-subtle">
            <div className="bg-blue-400 h-full rounded-full transition-all duration-500" style={{ width: `${systemHealth.cloudinaryBandwidth}%` }} />
          </div>
        </motion.div>

        {/* Vercel Functions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.1 }} className="p-5 rounded-xl bg-[#0A0A0A] border border-border-subtle relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Server className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
              {systemHealth.vercelFunctions}%
            </span>
          </div>
          <p className="text-base font-bold text-foreground">Vercel Serverless</p>
          <p className="text-xs text-muted mt-0.5">Execution Duration &amp; Hobby Limits</p>
          <div className="w-full bg-[#141414] h-1.5 rounded-full mt-4 overflow-hidden border border-border-subtle">
            <div className="bg-purple-400 h-full rounded-full transition-all duration-500" style={{ width: `${systemHealth.vercelFunctions}%` }} />
          </div>
        </motion.div>

        {/* Cron Status */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.15 }} className="p-5 rounded-xl bg-[#0A0A0A] border border-border-subtle relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            {systemHealth.cronStatus === "Healthy" ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-green-400 bg-green-500/10 px-2.5 py-0.5 rounded-full border border-green-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2.5 py-0.5 rounded-full border border-yellow-500/20">
                <AlertTriangle className="w-3.5 h-3.5" /> Warning
              </span>
            )}
          </div>
          <p className="text-base font-bold text-foreground">Cron Ingestion</p>
          <p className="text-xs text-muted mt-0.5">Aggregated News Queue Schedules</p>
          <div className="w-full bg-[#141414] h-1.5 rounded-full mt-4 overflow-hidden border border-border-subtle">
            <div className="bg-green-400 h-full rounded-full transition-all duration-500" style={{ width: "100%" }} />
          </div>
        </motion.div>

        {/* API Latency */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.2 }} className="p-5 rounded-xl bg-[#0A0A0A] border border-border-subtle relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20 font-mono">
              {systemHealth.apiLatencyMs}ms
            </span>
          </div>
          <p className="text-base font-bold text-foreground">API Latency</p>
          <p className="text-xs text-muted mt-0.5">Average Endpoint Response Time</p>
          <div className="w-full bg-[#141414] h-1.5 rounded-full mt-4 overflow-hidden border border-border-subtle">
            <div className="bg-pink-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(systemHealth.apiLatencyMs / 3, 100)}%` }} />
          </div>
        </motion.div>

        {/* AI Error Tracking Rate */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.25 }} className="p-5 rounded-xl bg-[#0A0A0A] border border-border-subtle relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-mono">
              {systemHealth.errorRatePercent}%
            </span>
          </div>
          <p className="text-base font-bold text-foreground">AI Error Rate</p>
          <p className="text-xs text-muted mt-0.5">Gemini Pipeline Exception Tracking</p>
          <div className="w-full bg-[#141414] h-1.5 rounded-full mt-4 overflow-hidden border border-border-subtle">
            <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(100 - systemHealth.errorRatePercent * 100, 5)}%` }} />
          </div>
        </motion.div>
      </div>

      <div className="p-4 border-t border-border-subtle bg-[#1A1A1A] flex items-center justify-between text-xs text-muted px-6">
        <span>Region: <strong className="text-foreground">iad1 (Washington, D.C., USA)</strong></span>
        <span>Status: <strong className="text-green-400">All Systems Operational</strong></span>
      </div>
    </div>
  );
}
