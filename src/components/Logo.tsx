import { IconTooth } from "@/components/icons";
import { cn } from "@/lib/utils";

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl text-white", light ? "bg-white/10" : "bg-ink")}>
        <IconTooth size={18} />
      </span>
      <span className="leading-none">
        <span className={cn("block text-[15px] font-bold tracking-tight", light ? "text-white" : "text-ink")}>DJALEDEH</span>
        <span className={cn("mt-1 block text-[10px] font-medium uppercase tracking-[0.16em]", light ? "text-white/60" : "text-faint")}>Dental Care</span>
      </span>
    </div>
  );
}