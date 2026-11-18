import { useEffect, useState } from "react";
import { AreaChart, Donut, GroupedBars, HBars } from "@/components/charts";
import { Card, CardTitle, PageHeader } from "@/components/ui/Card";
import { PageLoadError, PageSkeleton } from "@/components/ui/Skeleton";
import { StatGrid } from "@/components/ui/Stat";
import { depenses } from "@/data/services";
import { useDonnees } from "@/data/useDonnees";
import { categorieActe, categorieParLibelle, LIBELLE_CATEGORIE_SOIN } from "@/lib/categories";
import { buckets, type Periode } from "@/lib/periodes";
import { estAssure, payeParDe, reste } from "@/lib/tarifs";
import { cn, formatDateFr, formatFcfa } from "@/lib/utils";
import type { CategorieSoin, Depense } from "@/types";

const PERIODES: [Periode, string][] = [["jour", "Aujourd'hui"], ["7j", "7 jours"], ["30j", "30 jours"], ["12m", "12 mois"]];
const somme = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

export default function Facturation() {
  const donnees = useDonnees();
  const [per, setPer] = useState<Periode>("30j");
  const [depensesLignes, setDepensesLignes] = useState<Depense[] | null>(null);
  const [erreurDepenses, setErreurDepenses] = useState("");
  useEffect(() => {
    let active = true;
    void depenses.list()
      .then((rows) => { if (active) setDepensesLignes(rows); })
      .catch((error: unknown) => {
        if (active) setErreurDepenses(error instanceof Error ? error.message : "Impossible de charger les dépenses.");
      });
    return () => { active = false; };
  }, []);
  if (donnees.status === "loading") return <PageSkeleton />;
  if (donnees.status === "error") return <PageLoadError error={donnees.error} />;
  const d = donnees.data;

  const bs = buckets(per), from = bs[0].from, to = bs[bs.length - 1].to;
  const dans = (date: string, a = from, b = to) => date >= a && date < b;
  const paiements = d.factures.flatMap((f) => f.paiements);
  const facP = d.factures.filter((f) => dans(f.dateEmission));
  const encaisse = somme(paiements.filter((x) => dans(x.date)).map((x) => x.montant));
  const depensesPeriode = (depensesLignes ?? []).filter((x) => dans(x.date));
  const totalDepenses = somme(depensesPeriode.map((x) => x.montant));
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
  const actesParId = new Map(d.actes.map((acte) => [acte.id, acte]));
  const patientsParId = new Map(d.patients.map((patient) => [patient.id, patient]));
  const recettesParCategorie: Record<CategorieSoin, { assure: number; nonAssure: number }> = {
    prothese: { assure: 0, nonAssure: 0 },
    autres: { assure: 0, nonAssure: 0 },
  };
  d.factures.forEach((f) => {
    const totauxLignes: Record<CategorieSoin, number> = { prothese: 0, autres: 0 };
    for (const ligne of f.lignes ?? []) {
      const acte = actesParId.get(ligne.acteId);
      const categorie = ligne.categorie
        ?? (acte ? categorieActe(acte) : ligne.code?.toUpperCase().startsWith("SPR") ? "prothese" : categorieParLibelle(ligne.libelle));
      totauxLignes[categorie] += ligne.montant;
    }
    const totalLignes = somme(Object.values(totauxLignes));
    const estPatientAssure = Boolean(f.entrepriseId) || estAssure(patientsParId.get(f.patientId)?.natureConsultation);
    const groupe = estPatientAssure ? "assure" : "nonAssure";
    for (const paiement of f.paiements ?? []) {
      if (!dans(paiement.date)) continue;
      const partProthese = totalLignes > 0 ? Math.round(paiement.montant * totauxLignes.prothese / totalLignes) : 0;
      recettesParCategorie.prothese[groupe] += partProthese;
      recettesParCategorie.autres[groupe] += paiement.montant - partProthese;
    }
  });
  const lignesDepensesRecentes = [...depensesPeriode].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

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
        { label: "Patients", value: d.patientsActifs.length },
        { label: "Dépenses", value: depensesLignes ? formatFcfa(totalDepenses) : "—", hint: "sur la période" },
        { label: "Solde après dépenses", value: depensesLignes ? formatFcfa(encaisse - totalDepenses) : "—", hint: "encaissé moins dépenses" }
      ]} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="animate-rise overflow-hidden lg:col-span-2">
          <CardTitle eyebrow="Encaissements sur la période" title="Recettes par type de soins et couverture" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-canvas text-xs text-mute">
                <tr><th className="px-5 py-3 font-medium">Type de soins</th><th className="px-5 py-3 text-right font-medium">Patients assurés</th><th className="px-5 py-3 text-right font-medium">Patients non assurés</th><th className="px-5 py-3 text-right font-medium">Total</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(["prothese", "autres"] as const).map((categorie) => {
                  const valeurs = recettesParCategorie[categorie];
                  return <tr key={categorie}>
                    <th className="px-5 py-3 font-medium">{LIBELLE_CATEGORIE_SOIN[categorie]}</th>
                    <td className="num px-5 py-3 text-right">{formatFcfa(valeurs.assure)}</td>
                    <td className="num px-5 py-3 text-right">{formatFcfa(valeurs.nonAssure)}</td>
                    <td className="num px-5 py-3 text-right font-semibold">{formatFcfa(valeurs.assure + valeurs.nonAssure)}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
          <p className="px-5 pb-4 text-xs text-mute">Les paiements couvrant plusieurs types de soins sont répartis au prorata des montants des actes sur la facture.</p>
        </Card>
        <Card className="animate-rise overflow-hidden lg:col-span-2">
          <CardTitle eyebrow="Sorties sur la période" title="Dépenses enregistrées" />
          {erreurDepenses ? (
            <p role="alert" className="px-5 py-4 text-sm text-danger">Impossible de charger les dépenses : {erreurDepenses}</p>
          ) : !depensesLignes ? (
            <p className="px-5 py-4 text-sm text-mute">Chargement des dépenses…</p>
          ) : lignesDepensesRecentes.length ? (
            <>
              <ul className="divide-y divide-line">
                {lignesDepensesRecentes.map((depense) => (
                  <li key={depense.id} className="flex items-center gap-4 px-5 py-3.5 text-sm">
                    <span className="num w-24 text-mute">{formatDateFr(depense.date)}</span>
                    <span className="flex-1">{depense.libelle}</span>
                    <span className="num font-semibold">{formatFcfa(depense.montant)}</span>
                  </li>
                ))}
              </ul>
              {depensesPeriode.length > lignesDepensesRecentes.length && <p className="px-5 py-3 text-xs text-mute">Les 8 dépenses les plus récentes sont affichées.</p>}
            </>
          ) : <p className="px-5 py-10 text-center text-sm text-faint">Aucune dépense sur cette période.</p>}
        </Card>
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
