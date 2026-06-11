"use client";

import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";

export const motionCurves = {
  cinematic: [0.22, 1, 0.36, 1] as [number, number, number, number],
  standard: [0.25, 0.8, 0.25, 1] as [number, number, number, number],
  exit: [0.4, 0, 0.2, 1] as [number, number, number, number],
};

export const motionSprings = {
  page: { type: "spring", stiffness: 260, damping: 30, mass: 0.72 },
  dock: { type: "spring", stiffness: 420, damping: 34, mass: 0.65 },
  soft: { type: "spring", stiffness: 220, damping: 24, mass: 0.8 },
  modal: { type: "spring", stiffness: 300, damping: 28, mass: 0.82 },
} as const;

export const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const pressTap = {
  scale: 0.96,
  transition: { duration: 0.12, ease: motionCurves.standard },
};

export function useMotionProfile() {
  const prefersReducedMotion = useReducedMotion();
  const [isLowEndAndroid, setIsLowEndAndroid] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 3;
    const lowCpu = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4;
    const slowNetwork = nav.connection?.saveData || nav.connection?.effectiveType === "2g";
    const android = /Android/i.test(navigator.userAgent);

    setIsLowEndAndroid(Boolean(android && (lowMemory || lowCpu || slowNetwork)));
  }, []);

  return useMemo(() => {
    const reduce = Boolean(prefersReducedMotion || isLowEndAndroid);

    return {
      reduce,
      isLowEndAndroid,
      pageOffset: reduce ? 8 : 22,
      pageDuration: reduce ? 0.18 : 0.34,
      shimmerDuration: reduce ? "2.2s" : "1.45s",
      blurClass: reduce ? "bg-[#141414]/94" : "bg-[#141414]/78 backdrop-blur-xl",
      spring: reduce
        ? ({ type: "spring", stiffness: 360, damping: 42, mass: 0.55 } as const)
        : motionSprings.page,
    };
  }, [isLowEndAndroid, prefersReducedMotion]);
}
