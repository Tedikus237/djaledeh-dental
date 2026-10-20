import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { uid } from "@/data/db";
import { actes as actesSvc, comptes, entreprises as entSvc, factures, soins } from "@/data/services";
import { isoDay } from "@/lib/dates";
import { libelleCode, prixActe, repartition, statutDe } from "@/lib/tarifs";
import { formatFcfa } from "@/lib/utils";
import type { Acte, Compte, Entreprise, LigneSoin, ModePaiement, Paiement, Patient } from "@/types";

export const MODES: Record<ModePaiement, string> = { especes: "Espèces", mobile_money: "Mobile money", assurance: "Assurance", autre: "Autre" };

export function SoinForm({ patient, onSaved }: { patient: Patient; onSaved: () => void }) {
  const assure = patient.natureConsultation === "assurance";
  const [catalogue, setCatalogue] = useState<Acte[]>([]);
  const [ents, setEnts] = useState<Entreprise[]>([]);
  const [praticiens, setPraticiens] = useState<Compte[]>([]);
  const [date, setDate] = useState(isoDay());
  const [dents, setDents] = useState("");
  const [lignes, setLignes] = useState<LigneSoin[]>([]);
  const [acteId, setActeId] = useState("");
  const [entId, setEntId] = useState("");
  const [bon, setBon] = useState("");
  const [paye, setPaye] = useState("");
  const [mode, setMode] = useState<ModePaiement>("especes");
  const [prochain, setProchain] = useState("");
  const [prat, setPrat] = useState("Dr Deffo");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setCatalogue((await actesSvc.list()).filter((a) => a.actif));
      setEnts(await entSvc.list());
      setPraticiens((await comptes.list()).filter((c) => c.role !== "secretaire"));
    })();
  }, []);

  const ent = ents.find((e) => e.id === entId);
  const total = lignes.reduce((s, l) => s + l.montant, 0);
  const { partPatient, netEntreprise } = repartition(total, assure && !!ent, ent?.partPatient ?? 0);

  function ajouter() {
    const a = catalogue.find((x) => x.id === acteId);
    if (!a) return;
    setLignes([...lignes, { acteId: a.id, code: libelleCode(a), libelle: a.libelle, qte: 1, montant: prixActe(a, assure) }]);
    setActeId("");
  }

  async function enregistrer() {
    setErr("");
    const montantPaye = Number(paye) || 0;
    if (!dents.trim()) return setErr("Indiquez la ou les dents soignées.");
    if (!lignes.length) return setErr("Ajoutez au moins un acte.");
    if (assure && !ent) return setErr("Choisissez l'entreprise ou l'assurance du patient.");
    if (ent?.bonRequis && !bon.trim()) return setErr("Le numéro du bon de prise en charge est obligatoire.");
    if (montantPaye < 0 || montantPaye > partPatient) return setErr(`Le montant encaissé doit être compris entre 0 et ${formatFcfa(partPatient)} (part du patient).`);
    setSaving(true);
    const annee = new Date(date).getFullYear();
    const n = (await factures.list()).filter((f) => f.numero.endsWith(`/${annee}`)).reduce((m, f) => Math.max(m, parseInt(f.numero, 10) || 0), 0) + 1;
    const paiements: Paiement[] = montantPaye > 0 ? [{ id: uid(), date, montant: montantPaye, mode, payeur: "patient" }] : [];
    const soin = await soins.create({
      patientId: patient.id, dateSoin: date, dents: dents.trim(), natureActes: lignes.map((l) => l.libelle).join(", "), montantTotal: total,
      montantPaye, dateProchainRdv: prochain, praticien: prat, lignes, factureId: "", createdAt: new Date().toISOString()
    });
    const fac = await factures.create({
      numero: `${String(n).padStart(4, "0")}/${annee}`, patientId: patient.id, soinId: soin.id, dateEmission: date, lignes, montantTotal: total,
      entrepriseId: ent?.id ?? "", bonPriseEnCharge: ent ? bon.trim() : "", partPatientPct: ent?.partPatient ?? 0, partPatient, netEntreprise,
      paiements, montantPaye, statut: statutDe(total, montantPaye)
    });
    await soins.update(soin.id, { factureId: fac.id });
    setLignes([]); setDents(""); setPaye(""); setBon(""); setProchain("");
    setSaving(false);
    onSaved();
  }

  return (
    <div>
      <p className="eyebrow mb-4">Nouveau soin</p>
      <p className="mb-4 text-sm text-mute">Tarif appliqué : <b className="text-ink">{assure ? "patient assuré (nomenclature)" : "patient non assuré"}</b></p>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Date du soin" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input label="Dent(s) soignée(s)" placeholder="ex. 36 ou 17, 36" value={dents} onChange={(e) => setDents(e.target.value)} />
      </div>

      <div className="mt-4 flex items-end gap-2">
        <div className="flex-1">
          <Select label="Acte" value={acteId} onChange={(e) => setActeId(e.target.value)}>
            <option value="">Choisir un acte du catalogue…</option>
            {catalogue.map((a) => <option key={a.id} value={a.id}>{a.libelle} ({libelleCode(a)}) — {formatFcfa(prixActe(a, assure))}</option>)}
          </Select>
        </div>
        <Button type="button" variant="outline" onClick={ajouter} disabled={!acteId}>Ajouter</Button>
      </div>

      {lignes.length > 0 && (
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
          {lignes.map((l, i) => (
            <li key={i} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <span className="min-w-0 flex-1"><b>{l.libelle}</b> <span className="text-mute">{l.code}</span></span>
              <input aria-label={`Montant ${l.libelle}`} type="number" min={0} value={l.montant} onChange={(e) => setLignes(lignes.map((x, j) => (j === i ? { ...x, montant: Number(e.target.value) || 0 } : x)))}
                className="num h-10 w-32 rounded-lg border border-line px-3 text-right text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" />
              <button type="button" onClick={() => setLignes(lignes.filter((_, j) => j !== i))} className="h-10 px-2 text-xs text-mute underline">Retirer</button>
            </li>
          ))}
        </ul>
      )}

      {assure && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Select label="Entreprise ou assurance" value={entId} onChange={(e) => setEntId(e.target.value)}>
            <option value="">Choisir…</option>
            {ents.map((e) => <option key={e.id} value={e.id}>{e.nom} (part patient {e.partPatient} %)</option>)}
          </Select>
          <Input label={`N° du bon de prise en charge${ent?.bonRequis ? "" : " (facultatif)"}`} value={bon} onChange={(e) => setBon(e.target.value)} />
        </div>
      )}

      <div className="mt-4 rounded-xl bg-canvas p-4 text-sm">
        <div className="flex justify-between"><span className="text-mute">Montant total</span><b className="num">{formatFcfa(total)}</b></div>
        {assure && ent && <>
          <div className="mt-1 flex justify-between"><span className="text-mute">Part du patient ({ent.partPatient} %)</span><b className="num">{formatFcfa(partPatient)}</b></div>
          <div className="mt-1 flex justify-between"><span className="text-mute">Net à payer par {ent.nom}</span><b className="num">{formatFcfa(netEntreprise)}</b></div>
        </>}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Input label="Montant encaissé aujourd'hui (FCFA)" type="number" min={0} value={paye} onChange={(e) => setPaye(e.target.value)} />
        <Select label="Mode de paiement" value={mode} onChange={(e) => setMode(e.target.value as ModePaiement)}>
          {Object.entries(MODES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Input label="Date du prochain RDV" type="date" value={prochain} onChange={(e) => setProchain(e.target.value)} />
        <Select label="Praticien" value={prat} onChange={(e) => setPrat(e.target.value)}>
          {praticiens.map((c) => <option key={c.id}>{c.nom}</option>)}
        </Select>
      </div>

      {err && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-danger">{err}</p>}
      <div className="mt-6"><Button onClick={enregistrer} loading={saving}>Enregistrer le soin et créer la facture</Button></div>
    </div>
  );
}
