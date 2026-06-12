"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { motionCurves, useMotionProfile } from "@/lib/motion";

const routeOrder = ["/", "/magazine", "/news", "/videos", "/about", "/privacy", "/admin"];

function getRouteIndex(pathname: string) {
  const match = routeOrder.findIndex((path) => pathname === path || (path !== "/" && pathname.startsWith(path)));
  return match === -1 ? routeOrder.length : match;
}

export default function PageAnimatePresence({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const profile = useMotionProfile();
  const previousPath = React.useRef(pathname);
  const direction = React.useMemo(() => {
    const previous = getRouteIndex(previousPath.current);
    const next = getRouteIndex(pathname);
    return next >= previous ? 1 : -1;
  }, [pathname]);

  React.useEffect(() => {
    previousPath.current = pathname;
  }, [pathname]);

  // Skip page animations on admin dashboard to keep interactions fast
  const isExcluded = pathname.startsWith("/admin");

  if (isExcluded) {
    return <>{children}</>;
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={pathname}
          custom={direction}
          initial={{ opacity: 0, x: direction * profile.pageOffset, scale: profile.reduce ? 1 : 0.992 }}
          animate={{
            opacity: 1,
            x: 0,
            scale: 1,
            transition: profile.reduce
              ? { duration: profile.pageDuration, ease: motionCurves.standard }
              : profile.spring,
          }}
          exit={{
            opacity: 0,
            x: direction * -profile.pageOffset,
            scale: profile.reduce ? 1 : 0.996,
            transition: { duration: profile.reduce ? 0.14 : 0.22, ease: motionCurves.exit },
          }}
          className="w-full flex-1 flex flex-col bg-[#0A0A0A] hw-accelerated page-transition-layer"
          style={{
            transformOrigin: "top center",
            contain: "layout paint",
          }}
          layoutId="kv-page-shell"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}
