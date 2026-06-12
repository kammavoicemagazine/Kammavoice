"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, BookOpen, Newspaper, Film, Menu, X, Settings, Info, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isNativePlatform } from "@/lib/capacitor-init";
import { triggerLightTap } from "@/lib/haptic-utils";
import { motionCurves, motionSprings, pressTap, useMotionProfile } from "@/lib/motion";

const NAV_ITEMS = [
  { path: "/", label: "Home", labelTe: "హోమ్", icon: Home },
  { path: "/magazine", label: "Magazines", labelTe: "మ్యాగజైన్", icon: BookOpen },
  { path: "/news", label: "News", labelTe: "వార్తలు", icon: Newspaper },
  { path: "/videos", label: "Reels", labelTe: "రీల్స్", icon: Film },
  { path: "menu", label: "Menu", labelTe: "మెనూ", icon: Menu },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("/");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const motionProfile = useMotionProfile();
  useEffect(() => {
    // Show on native platform or mobile viewports
    const checkViewport = () => {
      const isReaderPage = pathname && pathname.includes("/magazine/") && pathname !== "/magazine";
      setShowNav((isNativePlatform || window.innerWidth < 1024) && !isReaderPage);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    
    return () => window.removeEventListener("resize", checkViewport);
  }, [pathname]);

  useEffect(() => {
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

  const handleTabClick = (path: string) => {
    triggerLightTap();
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
      {/* Floating Bottom Nav Container */}
      <div className="fixed bottom-3 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none pb-safe-bottom nav-gesture-safe">
        <motion.div 
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={motionProfile.reduce ? { duration: 0.2, ease: motionCurves.standard } : motionSprings.dock}
          className={`w-full max-w-md ${motionProfile.blurClass} border border-white/[0.08] rounded-[26px] pointer-events-auto overflow-hidden px-3 nav-dock hw-accelerated`}
          style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset" }}
          layout
        >
          <div className="h-16 flex items-center justify-between relative">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.path || (item.path === "menu" && isMenuOpen);
              
              return (
                <motion.button
                  key={item.label}
                  onClick={() => handleTabClick(item.path)}
                  whileTap={pressTap}
                  aria-label={item.label}
                  className="relative flex flex-col items-center justify-center flex-1 h-full py-1 text-center group cursor-pointer focus:outline-none ripple-touch"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-x-1 inset-y-1.5 rounded-[20px] bg-gradient-to-b from-gold/[0.12] via-gold/[0.045] to-transparent border border-gold/20 nav-active-glow"
                      transition={motionSprings.dock}
                    />
                  )}

                  {isActive && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-1.5 w-7 h-[2px] rounded-full bg-gradient-to-r from-transparent via-gold to-transparent"
                      transition={motionSprings.dock}
                    />
                  )}
                  
                  <motion.div
                    className={`relative z-10 ${isActive ? "text-gold" : "text-[#9A9A9A] group-hover:text-white"}`}
                    animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -1 : 0 }}
                    transition={motionSprings.soft}
                  >
                    {isActive && <span className="absolute inset-0 rounded-full bg-gold/18 blur-md nav-icon-pulse" />}
                    <Icon className="relative w-5 h-5 stroke-[2]" />
                  </motion.div>
                  
                  <span className={`text-[10px] mt-0.5 font-semibold z-10 transition-colors duration-200 ${
                    isActive ? "text-gold font-bold" : "text-[#9A9A9A] group-hover:text-white"
                  }`}>
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
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
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={motionSprings.modal}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#141414]/96 backdrop-blur-xl border-t border-white/[0.08] rounded-t-[28px] max-w-lg mx-auto pb-safe-bottom overflow-hidden"
              style={{ boxShadow: "0 -1px 0 rgba(255,255,255,0.04) inset" }}
            >
              {/* Drag Handle indicator */}
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto my-3.5" />
              
              <div className="flex items-center justify-between px-6 pb-4 border-b border-white/[0.06]">
                <div className="flex flex-col">
                  <span className="text-gold font-extrabold font-[family-name:var(--font-playfair)] tracking-wider text-lg">
                    KAMMA VOICE
                  </span>
                  <span className="text-[10px] text-gray-500 tracking-widest uppercase font-bold">
                    మీ తెలుగు డిజిటల్ మీడియా
                  </span>
                </div>
                <motion.button
                  onClick={() => setIsMenuOpen(false)}
                  whileTap={pressTap}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Bottom Sheet Navigation Grid (Modified to 3 columns, hiding downloads) */}
              <div className="grid grid-cols-3 gap-3 p-6 bg-black/20">


                {/* About Us */}
                <motion.button
                  onClick={() => { triggerLightTap(); setIsMenuOpen(false); router.push("/about"); }}
                  whileTap={pressTap}
                  className="flex flex-col items-center justify-center p-5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] rounded-2xl transition-all cursor-pointer group ripple-touch"
                >
                  <Info className="w-6 h-6 text-gold group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-xs font-semibold text-gray-200 mt-2">About Us</span>
                  <span className="text-[9px] text-gray-500 mt-0.5">Our Story</span>
                </motion.button>

                {/* Privacy Policy */}
                <motion.button
                  onClick={() => { triggerLightTap(); setIsMenuOpen(false); router.push("/privacy"); }}
                  whileTap={pressTap}
                  className="flex flex-col items-center justify-center p-5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] rounded-2xl transition-all cursor-pointer group ripple-touch"
                >
                  <ShieldAlert className="w-6 h-6 text-gold group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-xs font-semibold text-gray-200 mt-2">Privacy Policy</span>
                  <span className="text-[9px] text-gray-500 mt-0.5">Terms & Privacy</span>
                </motion.button>

                {/* Admin Portal */}
                <motion.button
                  onClick={() => { triggerLightTap(); setIsMenuOpen(false); router.push("/admin"); }}
                  whileTap={pressTap}
                  className="flex flex-col items-center justify-center p-5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] rounded-2xl transition-all cursor-pointer group ripple-touch"
                >
                  <Settings className="w-6 h-6 text-gold group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-xs font-semibold text-gray-200 mt-2">Admin Portal</span>
                  <span className="text-[9px] text-gray-500 mt-0.5">Upload Issues</span>
                </motion.button>
              </div>

              <div className="p-4 bg-[#141414] border-t border-white/[0.05] text-center">
                <p className="text-[10px] text-gray-500 font-semibold tracking-wider">
                  Kamma Voice v1.1.0 — Telugu Community Media
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
