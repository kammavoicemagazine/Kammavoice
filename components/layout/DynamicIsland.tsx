"use client";

import { useUIStore } from "@/lib/store/ui-store";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Languages, AlertCircle, CheckCircle2, Radio, X } from "lucide-react";
import { triggerLightTap } from "@/lib/haptic-utils";
import { motionSprings, pressTap } from "@/lib/motion";

export default function DynamicIsland() {
  const activeAlert = useUIStore((state) => state.activeAlert);
  const dismissAlert = useUIStore((state) => state.dismissAlert);

  const getIcon = (type: string) => {
    switch (type) {
      case "download":
        return <Download className="w-4 h-4 text-gold" />;
      case "translation":
        return <Languages className="w-4 h-4 text-cyan-400 animate-pulse" />;
      case "breaking":
        return <Radio className="w-4 h-4 text-red-500 live-pulse" />;
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gold" />;
    }
  };

  return (
    <div className="fixed top-3 left-0 right-0 z-[9999] flex justify-center pointer-events-none px-4 pt-safe-top">
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ scale: 0.8, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: -30, opacity: 0 }}
            transition={{
              ...motionSprings.modal,
            }}
            className="pointer-events-auto bg-[#141414]/90 backdrop-blur-xl border border-white/[0.08] rounded-full flex flex-col items-center overflow-hidden hw-accelerated"
            style={{
              maxWidth: "92vw",
              width: activeAlert.type === "download" ? "290px" : "auto",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.05) inset",
            }}
            layoutId="dynamicIsland"
          >
            {/* Main Content Row */}
            <div className="flex items-center gap-3 px-4 py-2.5 w-full">
              {/* Icon Container */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                {getIcon(activeAlert.type)}
              </div>

              {/* Text Info */}
              <div className="flex-1 min-w-0 pr-1">
                <h4 className="text-xs font-bold text-white truncate tracking-wide leading-tight">
                  {activeAlert.title}
                </h4>
                {activeAlert.subtitle && (
                  <p className="text-[10px] text-gray-400 truncate mt-0.5 font-medium leading-none">
                    {activeAlert.subtitle}
                  </p>
                )}
              </div>

              {/* Dismiss Button */}
              <motion.button
                onClick={() => {
                  triggerLightTap();
                  dismissAlert();
                }}
                whileTap={pressTap}
                className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                <X className="w-3 h-3" />
              </motion.button>
            </div>

            {/* Progress Bar (Only for active downloads) */}
            {activeAlert.type === "download" && typeof activeAlert.progress === "number" && (
              <div className="w-full bg-white/5 h-1 relative overflow-hidden flex-shrink-0">
                <motion.div
                  className="h-full origin-left bg-gradient-to-r from-gold-dark via-gold to-gold-light progress-gold"
                  style={{ scaleX: Math.max(0, Math.min(100, activeAlert.progress)) / 100 }}
                  transition={{ ease: "easeInOut", duration: 0.3 }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
