import type { ReactNode } from "react";
import type { Tone } from "@/lib/statuts";
import { cn } from "@/lib/utils";

const dot: Record<Tone, string> = { brand: "bg-brand", ink: "bg-ink", mute: "bg-faint", danger: "bg-danger" };

export function Status({ tone = "mute", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-[13px] font-medium">
      <span className={cn("h-1.5 w-1.5 rounded-full", dot[tone])} />
      {children}
    </span>
  );
}
