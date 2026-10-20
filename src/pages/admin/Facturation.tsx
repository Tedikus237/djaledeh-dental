import { useState } from "react";
import { AreaChart, Donut, GroupedBars, HBars } from "@/components/charts";
import { Card, CardTitle, PageHeader } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { StatGrid } from "@/components/ui/Stat";
import { useDonnees } from "@/data/useDonnees";
import { buckets, type Periode } from "@/lib/periodes";
import { payeParDe, reste } from "@/lib/tarifs";
import { cn, formatFcfa } from "@/lib/utils";

const PERIODES: [Periode, string][] = [["7j", "7 jours"], ["30j", "30 jours"], ["12m", "12 mois"]];
const somme = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

export default function Facturation() {
  const d = useDonnees();
  const [per, setPer] = useState<Periode>("30j");
  if (!d) return <PageSkeleton />;

  const bs = buckets(per), from = bs[0].from, to = bs[bs.length - 1].to;
  const dans = (date: string, a = from, b = to) => date >= a && date < b;
  const paiements = d.factures.flatMap((f) => f.paiements);
  const facP = d.factures.filter((f) => dans(f.dateEmission));
  const encaisse = somme(paiements.filter((x) => dans(x.date)).map((x) => x.montant));
  const facture = somme(facP.map((f) => f.montantTotal));
  const resteTotal = somme(d.factures.map(reste));

  const entrees = bs.map((b) => ({ label: b.label, value: somme(paiements.filter((x) => dans(x.date, b.from, b.to)).map((x) => x.montant)) }));
  const barres = bs.map((b) => ({ label: b.label, a: somme(d.factures.filter((f) => dans(f.dateEmission, b.from, b.to)).map((f) => f.montantTotal)), b: entrees.find((e) => e.label === b.label)?.value ?? 0 }));

  const nb = (s: string) => facP.filter((f) => f.statut === s).length;
  const statuts = [{ label: "Payées", value: nb("paye"), color: "#0EA5E9" }, { label: "Partielles", value: nb("partiel"), color: "#0B1220" }, { label: "Impayées", value: nb("impaye"), color: "#EF4444" }];

  const creances = d.entreprises.map((e) => ({ label: e.nom, value: somme(d.factures.filter((f) => f.entrepriseId === e.id).map((f) => f.netEntreprise - payeParDe(f, "entreprise"))) })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);
  const parPatient = d.patients.map((p) => ({ label: `${p.prenom} ${p.nom}`, value: somme(d.factures.filter((f) => f.patientId === p.id).map(reste)) })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value).slice(0, 6);
  const natures = (["standard", "express", "assurance"] as const).map((n, i) => ({ label: ["Standard", "Express", "Assurance"][i], value: d.patientsActifs.filter((p) => p.natureConsultation === n).length, color: ["#0B1220", "#8A94A6", "#0EA5E9"][i] }));
  const compte: Record<string, number> = {};
  facP.forEach((f) => f.lignes.forEach((l) => { compte[l.libelle] = (compte[l.libelle] ?? 0) + l.qte; }));
  const frequents = Object.entries(compte).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 5);

  return (
    <>
      <PageHeader eyebrow="Facturation" title="Tableau de bord financier">
        <div className="flex gap-1 rounded-xl border border-line bg-white p-1" role="tablist">
          {PERIODES.map(([k, l]) => (
            <button key={k} role="tab" aria-selected={per === k} onClick={() => setPer(k)} className={cn("h-10 rounded-lg px-4 text-sm font-medium transition-colors md:h-9", per === k ? "bg-ink text-white" : "text-mute hover:text-ink")}>{l}</button>
          ))}
        </div>
      </PageHeader>

      <StatGrid items={[
        { label: "Encaissé", value: formatFcfa(encaisse), hint: "sur la période" },
        { label: "Facturé", value: formatFcfa(facture), hint: `${facP.length} facture(s)` },
        { label: "Reste à payer", value: formatFcfa(resteTotal), hint: "toutes périodes", danger: resteTotal > 0 },
        { label: "Patients", value: d.patientsActifs.length }
      ]} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="animate-rise"><CardTitle eyebrow="Évolution" title="Entrées d'argent" /><div className="p-5"><AreaChart data={entrees} /></div></Card>
        <Card className="animate-rise">
          <CardTitle eyebrow="Comparaison" title="Facturé et encaissé">
            <span className="flex gap-4 text-xs text-mute"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-ink" />Facturé</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-brand" />Encaissé</span></span>
          </CardTitle>
          <div className="p-5"><GroupedBars data={barres} /></div>
        </Card>
        <Card className="animate-rise"><CardTitle eyebrow="Sur la période" title="Factures par statut" /><div className="p-5"><Donut parts={statuts} /></div></Card>
        <Card className="animate-rise"><CardTitle eyebrow="À recevoir" title="Ce que doivent les entreprises" /><div className="p-5"><HBars rows={creances} couleur="bg-danger" vide="Aucune créance en cours." /></div></Card>
        <Card className="animate-rise"><CardTitle eyebrow="À relancer" title="Patients avec un reste à payer" /><div className="p-5"><HBars rows={parPatient} couleur="bg-danger" vide="Aucun impayé." /></div></Card>
        <Card className="animate-rise"><CardTitle eyebrow="Patients" title="Répartition par type de consultation" /><div className="p-5"><Donut parts={natures} /></div></Card>
        <Card className="animate-rise lg:col-span-2"><CardTitle eyebrow="Sur la période" title="Actes les plus facturés" /><div className="p-5"><HBars rows={frequents} couleur="bg-brand" format={(v) => `${v} fois`} vide="Aucun acte facturé sur cette période." /></div></Card>
      </div>
    </>
  );
}
