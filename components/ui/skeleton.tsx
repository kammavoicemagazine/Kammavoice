import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "block" | "gold" | "muted";
}

export function Skeleton({ className, variant = "block" }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "skeleton relative overflow-hidden rounded-lg",
        variant === "gold" && "skeleton-gold",
        variant === "muted" && "skeleton-muted",
        className
      )}
    />
  );
}

/** Skeleton for a news card */
export function NewsCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-[#141414] border border-white/[0.06] shadow-sm skeleton-reveal">
      <Skeleton className="w-full h-48 rounded-none" variant="gold" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center gap-3 pt-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16 ml-auto" />
        </div>
      </div>
    </div>
  );
}

/** Skeleton for the hero section */
export function HeroSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 skeleton-reveal">
      <div className="lg:col-span-2">
        <Skeleton className="w-full h-[300px] md:h-[450px] lg:h-[500px] rounded-2xl" variant="gold" />
      </div>
      <div className="space-y-4">
        <Skeleton className="w-full h-[155px] rounded-xl" />
        <Skeleton className="w-full h-[155px] rounded-xl" />
        <Skeleton className="w-full h-[155px] rounded-xl" />
      </div>
    </div>
  );
}

/** Skeleton for a magazine cover list item */
export function MagazineCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-[#141414] border border-white/[0.06] p-3 skeleton-reveal">
      <Skeleton className="aspect-[3/4] w-full rounded-xl" variant="gold" />
      <div className="space-y-2 mt-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/** Skeleton for Reels/Shorts feed cards */
export function ReelsSkeleton() {
  return (
    <div className="w-full h-screen relative bg-black flex flex-col justify-end p-6 space-y-4 pb-24 skeleton-reveal">
      <div className="space-y-2 w-2/3">
        <Skeleton className="h-4 w-24 bg-white/10" />
        <Skeleton className="h-6 w-full bg-white/10" />
        <Skeleton className="h-4 w-1/2 bg-white/10" />
      </div>
      <Skeleton className="h-20 w-full rounded-2xl bg-white/5 border border-white/10" variant="muted" />
      <div className="absolute right-4 bottom-24 flex flex-col gap-5 items-center">
        <Skeleton className="w-11 h-11 rounded-full bg-white/10" />
        <Skeleton className="w-11 h-11 rounded-full bg-white/10" />
        <Skeleton className="w-11 h-11 rounded-full bg-white/10" />
        <Skeleton className="w-11 h-11 rounded-full bg-white/10" />
      </div>
    </div>
  );
}

/** Skeleton for downloads page items */
export function DownloadCardSkeleton() {
  return (
    <div className="flex items-center gap-4 bg-[#141414] border border-white/[0.06] rounded-2xl p-3.5 skeleton-reveal">
      <Skeleton className="w-16 h-20 rounded-lg" variant="gold" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <div className="flex items-center gap-3 pt-1">
          <Skeleton className="h-3.5 w-12" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      </div>
      <Skeleton className="w-10 h-10 rounded-xl bg-white/5" />
    </div>
  );
}

export function ArticleSkeleton() {
  return (
    <article className="max-w-4xl mx-auto px-4 py-10 skeleton-reveal">
      <Skeleton className="h-5 w-24 mb-4" variant="gold" />
      <Skeleton className="h-9 w-4/5 mb-3" />
      <Skeleton className="h-5 w-2/5 mb-8" />
      <Skeleton className="w-full h-[300px] md:h-[450px] rounded-2xl mb-8" variant="gold" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[92%]" />
        <Skeleton className="h-4 w-[97%]" />
        <Skeleton className="h-4 w-[76%]" />
      </div>
    </article>
  );
}
