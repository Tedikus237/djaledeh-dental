import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFcfa(montant: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(montant)) + " FCFA";
}

export function formatDateFr(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function calculerAge(dateNaissance: string): number {
  const n = new Date(dateNaissance);
  if (Number.isNaN(n.getTime())) return 0;
  const t = new Date();
  let age = t.getFullYear() - n.getFullYear();
  if (t < new Date(t.getFullYear(), n.getMonth(), n.getDate())) age--;
  return Math.max(age, 0);
}