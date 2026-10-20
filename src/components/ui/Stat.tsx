import { cn } from "@/lib/utils";

export interface StatItem { label: string; value: string | number; hint?: string; danger?: boolean }

export function StatGrid({ items }: { items: StatItem[] }) {
  return (
    <div className="mb-6 grid animate-rise grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
      {items.map((s) => (
        <div key={s.label} className="bg-white p-5">
          <p className="text-xs font-medium text-mute">{s.label}</p>
          <p className={cn("num mt-2 text-[26px] font-bold leading-none md:text-[28px]", s.danger && "text-danger")}>{s.value}</p>
          {s.hint && <p className="mt-2 text-xs text-faint">{s.hint}</p>}
        </div>
      ))}
    </div>
  );
}
