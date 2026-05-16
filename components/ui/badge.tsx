import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "gold" | "outline" | "danger";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors",
        {
          "bg-gold/20 text-gold-light": variant === "default",
          "bg-gold text-[#0A0A0A] font-bold": variant === "gold",
          "border border-gold/40 text-gold": variant === "outline",
          "bg-danger/20 text-danger": variant === "danger",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
