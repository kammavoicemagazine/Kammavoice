"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, BookOpen, Newspaper, Video, Menu, X, Settings, Info, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isNativePlatform } from "@/lib/capacitor-init";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

const NAV_ITEMS = [
  { path: "/", label: "Home", labelTe: "హోమ్", icon: Home },
  { path: "/magazine", label: "Magazines", labelTe: "మ్యాగజైన్", icon: BookOpen },
  { path: "/news", label: "News", labelTe: "వార్తలు", icon: Newspaper },
  { path: "/videos", label: "Videos", labelTe: "వీడియోలు", icon: Video },
  { path: "menu", label: "Menu", labelTe: "మెనూ", icon: Menu }, // Menu toggles bottom sheet
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("/");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNav, setShowNav] = useState(false);

  useEffect(() => {
    // Show only on native platform or mobile viewports
    const checkViewport = () => {
      setShowNav(isNativePlatform || window.innerWidth < 1024);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  useEffect(() => {
    // Update active tab based on pathname
    if (pathname === "/") {
      setActiveTab("/");
    } else if (pathname.startsWith("/magazine")) {
      setActiveTab("/magazine");
    } else if (pathname.startsWith("/news")) {
      setActiveTab("/news");
    } else if (pathname.startsWith("/videos")) {
      setActiveTab("/videos");
    } else {
      setActiveTab("");
    }
  }, [pathname]);

  const triggerHapticFeedback = async () => {
    if (isNativePlatform) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (err) {
        console.warn("[Haptics] Failed to trigger haptics:", err);
      }
    }
  };

  const handleTabClick = (path: string) => {
    triggerHapticFeedback();
    if (path === "menu") {
      setIsMenuOpen(true);
    } else {
      setIsMenuOpen(false);
      router.push(path);
    }
  };

  if (!showNav) return null;

  return (
    <>
      {/* Bottom Nav Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-border-subtle/50 pb-safe-bottom">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.path || (item.path === "menu" && isMenuOpen);
            
            return (
              <button
                key={item.label}
                onClick={() => handleTabClick(item.path)}
                className="relative flex flex-col items-center justify-center flex-1 h-full py-1 text-center group cursor-pointer focus:outline-none"
              >
                {/* Active Indicator Glow */}
                {isActive && (
                  <motion.div
                    layoutId="activeGlow"
                    className="absolute -top-[1px] left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-gold/50 via-gold to-gold/50 shadow-[0_0_12px_rgba(201,168,76,0.6)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                
                <div className={`relative transition-all duration-300 ${
                  isActive ? "text-gold scale-110" : "text-[#888888] group-hover:text-white"
                }`}>
                  <Icon className="w-5 h-5 stroke-[2]" />
                </div>
                
                <span className={`text-[10px] mt-1 font-semibold transition-all duration-300 ${
                  isActive ? "text-gold font-bold" : "text-[#888888] group-hover:text-white"
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Persistent Menu Bottom Sheet */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#141414] border-t border-border-subtle rounded-t-3xl max-w-lg mx-auto pb-safe-bottom overflow-hidden shadow-2xl"
            >
              {/* Drag Handle indicator */}
              <div className="w-12 h-1 bg-[#2C2C2C] rounded-full mx-auto my-3" />
              
              <div className="flex items-center justify-between px-6 pb-4 border-b border-border-subtle/50">
                <div className="flex flex-col">
                  <span className="text-gold font-bold font-[family-name:var(--font-playfair)] tracking-wide">
                    KAMMA VOICE
                  </span>
                  <span className="text-[10px] text-muted tracking-widest uppercase">
                    కమ్మ వాయిస్
                  </span>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 rounded-full bg-[#1C1C1C] hover:bg-[#2C2C2C] text-muted hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom Sheet Navigation Grid */}
              <div className="grid grid-cols-3 gap-4 p-6 bg-[#0A0A0A]/40">
                <button
                  onClick={() => { triggerHapticFeedback(); setIsMenuOpen(false); router.push("/about"); }}
                  className="flex flex-col items-center justify-center p-4 bg-[#1C1C1C]/60 hover:bg-[#2C2C2C]/80 border border-border-subtle/30 rounded-2xl transition-all cursor-pointer group"
                >
                  <Info className="w-6 h-6 text-gold group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-xs font-semibold text-gray-300 mt-2">About Us</span>
                </button>
                <button
                  onClick={() => { triggerHapticFeedback(); setIsMenuOpen(false); router.push("/privacy"); }}
                  className="flex flex-col items-center justify-center p-4 bg-[#1C1C1C]/60 hover:bg-[#2C2C2C]/80 border border-border-subtle/30 rounded-2xl transition-all cursor-pointer group"
                >
                  <ShieldAlert className="w-6 h-6 text-gold group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-xs font-semibold text-gray-300 mt-2">Privacy</span>
                </button>
                <button
                  onClick={() => { triggerHapticFeedback(); setIsMenuOpen(false); router.push("/admin"); }}
                  className="flex flex-col items-center justify-center p-4 bg-[#1C1C1C]/60 hover:bg-[#2C2C2C]/80 border border-border-subtle/30 rounded-2xl transition-all cursor-pointer group"
                >
                  <Settings className="w-6 h-6 text-gold group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-xs font-semibold text-gray-300 mt-2">Admin Portal</span>
                </button>
              </div>

              <div className="p-4 bg-[#141414] border-t border-border-subtle/30 text-center">
                <p className="text-[10px] text-muted">
                  Kamma Voice v1.0.0 — Telugu Community Media Platform
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
