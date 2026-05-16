import Image from "next/image";

interface AdBannerProps {
  variant?: "leaderboard" | "sidebar" | "inline";
  imageUrl?: string;
  linkUrl?: string;
  className?: string;
}

export default function AdBanner({
  variant = "leaderboard",
  imageUrl,
  linkUrl = "#",
  className = "",
}: AdBannerProps) {
  const heights: Record<string, string> = {
    leaderboard: "h-20 md:h-24",
    sidebar: "h-64",
    inline: "h-28",
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 ${className}`}>
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`block w-full ${heights[variant]} rounded-xl border border-border-subtle bg-surface-light overflow-hidden relative group`}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Advertisement"
            fill
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-xs text-muted uppercase tracking-widest">
                Advertisement
              </p>
              <p className="text-[10px] text-muted/50 mt-1">ప్రకటన</p>
            </div>
          </div>
        )}
      </a>
      <p className="text-[10px] text-muted/40 text-center mt-1 uppercase tracking-widest">
        Ad
      </p>
    </div>
  );
}
