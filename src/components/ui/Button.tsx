import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost";
const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-[#1B2437]",
  outline: "border border-line bg-white text-ink hover:bg-canvas",
  ghost: "text-mute hover:bg-black/5 hover:text-ink"
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; loading?: boolean }

export function Button({ className, variant = "primary", loading, disabled, children, ...p }: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 md:h-10", variants[variant], className)}
      {...p}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}
