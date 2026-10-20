import { isoDay } from "./dates";

export type Periode = "7j" | "30j" | "12m";
export interface Bucket { label: string; from: string; to: string }

export function buckets(p: Periode): Bucket[] {
  const out: Bucket[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (p === "12m") {
    for (let i = 11; i >= 0; i--) {
      const a = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const b = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
      out.push({ label: a.toLocaleDateString("fr-FR", { month: "short" }), from: isoDay(a), to: isoDay(b) });
    }
    return out;
  }
  const n = p === "7j" ? 7 : 30, pas = p === "7j" ? 1 : 5;
  for (let s = n - 1; s >= 0; s -= pas) {
    const a = new Date(today); a.setDate(a.getDate() - s);
    const b = new Date(a); b.setDate(b.getDate() + pas);
    out.push({ label: a.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), from: isoDay(a), to: isoDay(b) });
  }
  return out;
}
