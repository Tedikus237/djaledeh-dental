import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAcces } from "@/auth/useAcces";
import { IconDownload } from "@/components/icons";
import { MODES } from "@/components/SoinForm";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, PageHeader } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { Status } from "@/components/ui/Status";
import { uid } from "@/data/db";
import { entreprises, factures, patients } from "@/data/services";
import { isoDay } from "@/lib/dates";
import { telechargerFacture } from "@/lib/facturePdf";
import { payeParDe, reste, statutDe } from "@/lib/tarifs";
import { formatDateFr, formatFcfa } from "@/lib/utils";
import type { Entreprise, Facture, ModePaiement, Patient } from "@/types";
import { STATUT_F } from "./Liste";

export default function DetailFacture() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const { peutEditer } = useAcces();
  const [f, setF] = useState<Facture | null | undefined>(undefined);
  const [p, setP] = useState<Patient | null>(null);
  const [e, setE] = useState<Entreprise | null>(null);
  const [montant, setMontant] = useState("");
  const [mode, setMode] = useState<ModePaiement>("especes");
  const [payeur, setPayeur] = useState<"patient" | "entreprise">("patient");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const fac = await factures.get(id);
      setF(fac);
      if (fac) { setP(await patients.get(fac.patientId)); setE(fac.entrepriseId ? await entreprises.get(fac.entrepriseId) : null); }
    })();
  }, [id]);

  if (f === undefined) return <PageSkeleton />;
  if (!f || !p) return <Card className="p-10 text-center text-sm text-mute">Facture introuvable.</Card>;

  const dueP = f.partPatient - payeParDe(f, "patient");
  const dueE = f.netEntreprise - payeParDe(f, "entreprise");

  async function payer() {
    if (!f) return;
    const m = Number(montant);
    const max = payeur === "patient" ? dueP : dueE;
    if (!(m > 0)) return setErr("Saisissez un montant supérieur à 0.");
    if (m > max) return setErr(`Ce paiement dépasse ce qui reste à régler (${formatFcfa(max)}).`);
    const paiements = [...f.paiements, { id: uid(), date: isoDay(), montant: m, mode, payeur }];
    const montantPaye = paiements.reduce((s, x) => s + x.montant, 0);
    const maj = { paiements, montantPaye, statut: statutDe(f.montantTotal, montantPaye) };
    await factures.update(f.id, maj);
    setF({ ...f, ...maj });
    setMontant(""); setErr("");
  }

  return (
    <>
      <PageHeader eyebrow={`Facture N°${f.numero}`} title={`${p.prenom} ${p.nom}`}>
        <Button variant="outline" onClick={() => nav("/factures")}>Retour</Button>
        <Button onClick={() => telechargerFacture(f, p, e)}><IconDownload size={16} />Télécharger le PDF</Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card className="animate-rise overflow-hidden">
            <CardTitle eyebrow={formatDateFr(f.dateEmission)} title="Détail des actes" />
            <ul className="divide-y divide-line">
              {f.lignes.map((l, i) => (
                <li key={i} className="flex items-center gap-4 px-5 py-3.5 text-sm"><span className="flex-1">{l.libelle} <span className="text-mute">{l.code}</span></span><span className="num font-semibold">{formatFcfa(l.montant)}</span></li>
              ))}
            </ul>
            <div className="space-y-1.5 border-t border-line bg-canvas px-5 py-4 text-sm">
              <div className="flex justify-between"><span className="text-mute">Montant total</span><b className="num">{formatFcfa(f.montantTotal)}</b></div>
              {e && <>
                <div className="flex justify-between"><span className="text-mute">Part du patient ({f.partPatientPct} %)</span><b className="num">{formatFcfa(f.partPatient)}</b></div>
                <div className="flex justify-between"><span className="text-mute">Net à payer par {e.nom}{f.bonPriseEnCharge ? ` (bon N° ${f.bonPriseEnCharge})` : ""}</span><b className="num">{formatFcfa(f.netEntreprise)}</b></div>
              </>}
            </div>
          </Card>

          <Card className="animate-rise overflow-hidden">
            <CardTitle eyebrow="Historique" title="Paiements reçus" />
            {f.paiements.length ? (
              <ul className="divide-y divide-line">
                {f.paiements.map((x) => (
                  <li key={x.id} className="flex items-center gap-4 px-5 py-3.5 text-sm">
                    <span className="num w-24 text-mute">{formatDateFr(x.date)}</span>
                    <span className="flex-1 text-mute">{MODES[x.mode]} · {x.payeur === "patient" ? "patient" : e?.nom ?? "entreprise"}</span>
                    <span className="num font-semibold">{formatFcfa(x.montant)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="px-5 py-10 text-center text-sm text-faint">Aucun paiement pour l'instant.</p>}
          </Card>
        </div>

        <Card className="animate-rise self-start p-5">
          <div className="mb-4 flex items-center justify-between"><p className="eyebrow">Règlement</p><Status tone={STATUT_F[f.statut].tone}>{STATUT_F[f.statut].label}</Status></div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-mute">Payé</span><b className="num">{formatFcfa(f.montantPaye)}</b></div>
            <div className="flex justify-between"><span className="text-mute">Reste à payer</span><b className={`num ${reste(f) > 0 ? "text-danger" : ""}`}>{formatFcfa(reste(f))}</b></div>
            {e && <p className="pt-2 text-xs text-mute">Dont patient : {formatFcfa(dueP)} · {e.nom} : {formatFcfa(dueE)}</p>}
          </div>
          {peutEditer && reste(f) > 0 && (
            <div className="mt-5 space-y-4 border-t border-line pt-5">
              <Input label="Montant reçu (FCFA)" type="number" min={0} value={montant} onChange={(ev) => setMontant(ev.target.value)} error={err} />
              <Select label="Mode de paiement" value={mode} onChange={(ev) => setMode(ev.target.value as ModePaiement)}>
                {Object.entries(MODES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
              {e && <Select label="Payé par" value={payeur} onChange={(ev) => setPayeur(ev.target.value as "patient" | "entreprise")}><option value="patient">Le patient</option><option value="entreprise">{e.nom}</option></Select>}
              <Button className="w-full" onClick={payer}>Enregistrer le paiement</Button>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
