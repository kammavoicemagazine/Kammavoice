import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 focus:ring-offset-[#0A0A0A] disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          {
            "bg-gold text-[#0A0A0A] hover:bg-gold-light active:bg-gold-dark":
              variant === "primary",
            "bg-surface-light text-foreground hover:bg-surface-hover border border-border-subtle":
              variant === "secondary",
            "border border-gold/40 text-gold hover:bg-gold/10":
              variant === "outline",
            "text-muted hover:text-foreground hover:bg-surface-light":
              variant === "ghost",
          },
          {
            "px-3 py-1.5 text-sm": size === "sm",
            "px-5 py-2.5 text-sm": size === "md",
            "px-7 py-3 text-base": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
