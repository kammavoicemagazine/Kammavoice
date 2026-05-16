import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("skeleton", className)} />;
}

/** Skeleton for a news card */
export function NewsCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-surface border border-border-subtle">
      <Skeleton className="w-full h-48 rounded-none" />
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
      <div className="lg:col-span-2">
        <Skeleton className="w-full h-[300px] md:h-[450px] lg:h-[500px] rounded-2xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="w-full h-[155px] rounded-xl" />
        <Skeleton className="w-full h-[155px] rounded-xl" />
        <Skeleton className="w-full h-[155px] rounded-xl" />
      </div>
    </div>
  );
}
