import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, PageHeader } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { Status } from "@/components/ui/Status";
import { useDonnees } from "@/data/useDonnees";
import type { Tone } from "@/lib/statuts";
import { reste } from "@/lib/tarifs";
import { cn, formatDateFr, formatFcfa } from "@/lib/utils";
import type { StatutFacture } from "@/types";

export const STATUT_F: Record<StatutFacture, { label: string; tone: Tone }> = {
  paye: { label: "Payée", tone: "brand" }, partiel: { label: "Partielle", tone: "ink" }, impaye: { label: "Impayée", tone: "danger" }
};
const FILTRES: ["tous" | StatutFacture, string][] = [["tous", "Toutes"], ["impaye", "Impayées"], ["partiel", "Partielles"], ["paye", "Payées"]];

export default function ListeFactures() {
  const d = useDonnees();
  const nav = useNavigate();
  const [filtre, setFiltre] = useState<"tous" | StatutFacture>("tous");
  if (!d) return <PageSkeleton />;
  const rows = d.factures.filter((f) => filtre === "tous" || f.statut === filtre).sort((a, b) => b.dateEmission.localeCompare(a.dateEmission) || b.numero.localeCompare(a.numero));
  const cols = "md:grid-cols-[90px_100px_1.5fr_1fr_1fr_110px]";

  return (
    <>
      <PageHeader eyebrow="Facturation" title="Factures" />
      <div className="mb-4 flex flex-wrap gap-2" role="tablist">
        {FILTRES.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={filtre === k} onClick={() => setFiltre(k)}
            className={cn("h-11 rounded-xl border px-4 text-sm font-medium transition-colors md:h-10", filtre === k ? "border-ink bg-ink text-white" : "border-line bg-white text-mute hover:text-ink")}>{l}</button>
        ))}
      </div>
      <Card className="animate-rise overflow-hidden">
        <div className={`hidden gap-4 border-b border-line px-5 py-3 text-xs font-medium text-mute md:grid ${cols}`}>
          <span>N°</span><span>Date</span><span>Patient</span><span className="text-right">Total</span><span className="text-right">Reste</span><span>Statut</span>
        </div>
        {rows.length ? (
          <ul className="divide-y divide-line">
            {rows.slice(0, 60).map((f) => (
              <li key={f.id}>
                <button onClick={() => nav(`/factures/${f.id}`)} className={`grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-4 text-left transition-colors hover:bg-canvas md:grid ${cols}`}>
                  <span className="num hidden text-sm font-semibold md:block">{f.numero}</span>
                  <span className="num hidden text-sm text-mute md:block">{formatDateFr(f.dateEmission)}</span>
                  <span className="min-w-0"><span className="block truncate text-sm font-semibold">{d.patient(f.patientId)}</span><span className="num block text-xs text-mute md:hidden">{f.numero} · {formatDateFr(f.dateEmission)}</span></span>
                  <span className="num hidden text-right text-sm md:block">{formatFcfa(f.montantTotal)}</span>
                  <span className={cn("num text-right text-sm font-semibold", reste(f) > 0 ? "text-danger" : "text-mute")}>{reste(f) > 0 ? formatFcfa(reste(f)) : "Soldée"}</span>
                  <span className="hidden md:block"><Status tone={STATUT_F[f.statut].tone}>{STATUT_F[f.statut].label}</Status></span>
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="px-5 py-12 text-center text-sm text-faint">Aucune facture dans cette catégorie.</p>}
      </Card>
    </>
  );
}
