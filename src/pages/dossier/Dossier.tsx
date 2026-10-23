import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useAcces } from "@/auth/useAcces";
import { IconArrowRight, IconSave } from "@/components/icons";
import { Odontogramme } from "@/components/Odontogramme";
import { SoinForm } from "@/components/SoinForm";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, PageHeader } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Field";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { dossiers, patients, rdvs, soins } from "@/data/services";
import { isoDay } from "@/lib/dates";
import { cn, formatDateFr, formatFcfa } from "@/lib/utils";
import type { DossierMedical, Patient, Soin } from "@/types";

type Onglet = "identification" | "examen" | "diagnostic" | "suivi";
const ONGLETS: [Onglet, string][] = [["identification", "Identification"], ["examen", "Examen"], ["diagnostic", "Diagnostic"], ["suivi", "Suivi des soins"]];
const EXO = ["Ouverture buccale", "ATM", "Adénopathie", "Autres"];
const ENDO = ["Tartre", "Halitose", "Gencive", "Muqueuse", "Diastème", "DDM"];

const vide = (patientId: string): DossierMedical => {
  const now = new Date().toISOString();
  return { id: "", patientId, dateConsultation: isoDay(), motif: "", histoireMaladie: "", antecedents: "", exobuccal: {}, endobuccal: {},
    examen: {}, examenMc: "", examensComplementaires: "", commentaireExamens: "", diagnostic: "", cat: "", odontogramme: {}, soins: [], historique: [], createdAt: now, updatedAt: now };
};

export default function Dossier() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { docteurId, peutEditer } = useAcces();
  const [p, setP] = useState<Patient | null | undefined>(undefined);
  const [f, setF] = useState<DossierMedical | null>(null);
  const [liste, setListe] = useState<Soin[]>([]);
  const [onglet, setOnglet] = useState<Onglet>("identification");
  const [acces, setAcces] = useState(true);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const pat = await patients.get(id);
      setP(pat);
      if (!pat) return;
      if (docteurId && !(await rdvs.list()).some((r) => r.patientId === id && r.docteurId === docteurId)) { setAcces(false); return; }
      setF((await dossiers.list()).find((x) => x.patientId === id) ?? vide(id));
      setListe((await soins.list()).filter((s) => s.patientId === id).sort((a, b) => b.dateSoin.localeCompare(a.dateSoin)));
    })();
  }, [id, docteurId]);

  if (p === undefined) return <PageSkeleton />;
  if (!p) return <Card className="p-10 text-center text-sm text-mute">Patient introuvable.</Card>;
  if (!acces) return <Card className="p-10 text-center text-sm text-mute">Ce patient n'a pas de rendez-vous avec vous : accès non autorisé.</Card>;
  if (!f) return <PageSkeleton />;

  const maj = (patch: Partial<DossierMedical>) => setF({ ...f, ...patch });
  const idx = ONGLETS.findIndex((o) => o[0] === onglet);
  const lecture = !peutEditer;
  const recharger = async () => setListe((await soins.list()).filter((x) => x.patientId === id).sort((a, b) => b.dateSoin.localeCompare(a.dateSoin)));

  async function enregistrer() {
    if (!f || !user) return;
    setSaving(true);
    const now = new Date().toISOString();
    const label = ONGLETS[idx][1];
    const historique = [...f.historique, { date: now, par: user.nom, resume: f.id ? `Modification, onglet « ${label} »` : "Dossier créé" }];
    const base = { ...f, historique, updatedAt: now };
    if (f.id) {
      await dossiers.update(f.id, base);
      setF(base);
    } else {
      const sansId: Partial<DossierMedical> = { ...base };
      delete sansId.id;
      setF(await dossiers.create(sansId as Omit<DossierMedical, "id">));
    }
    setSaving(false);
    setMsg("Dossier enregistré.");
    setTimeout(() => setMsg(""), 2500);
  }

  return (
    <>
      <PageHeader eyebrow={`${p.numeroDossier} · Dossier médical`} title={`${p.prenom} ${p.nom}`}>
        <Button variant="outline" onClick={() => nav(`/patients/${id}`)}>Retour à la fiche</Button>
      </PageHeader>

      {lecture && <p className="mb-4 rounded-xl bg-canvas px-4 py-3 text-sm text-mute">Consultation seule : ce profil ne peut pas modifier le dossier.</p>}

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {ONGLETS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={onglet === k} onClick={() => setOnglet(k)}
            className={cn("-mb-px h-11 shrink-0 border-b-2 px-4 text-sm font-medium transition-colors", onglet === k ? "border-ink text-ink" : "border-transparent text-mute hover:text-ink")}>{l}</button>
        ))}
      </div>

      <Card className="animate-rise p-6">
        {onglet === "identification" && (
          <div className="grid gap-4">
            <div className="max-w-xs"><Input label="Date de consultation" type="date" disabled={lecture} value={f.dateConsultation} onChange={(e) => maj({ dateConsultation: e.target.value })} /></div>
            <Textarea label="Motif de consultation" disabled={lecture} value={f.motif} onChange={(e) => maj({ motif: e.target.value })} />
            <Textarea label="Histoire de la maladie" rows={5} disabled={lecture} value={f.histoireMaladie} onChange={(e) => maj({ histoireMaladie: e.target.value })} />
            <Textarea label="Antécédents" disabled={lecture} value={f.antecedents} onChange={(e) => maj({ antecedents: e.target.value })} />
          </div>
        )}

        {onglet === "examen" && (
          <div className="space-y-8">
            <section>
              <p className="eyebrow mb-4">Examen exobuccal</p>
              <div className="grid gap-4 md:grid-cols-2">
                {EXO.map((k) => <Input key={k} label={k} disabled={lecture} value={f.exobuccal[k] ?? ""} onChange={(e) => maj({ exobuccal: { ...f.exobuccal, [k]: e.target.value } })} />)}
              </div>
            </section>
            <section>
              <p className="eyebrow mb-4">Examen endobuccal</p>
              <div className="grid gap-4 md:grid-cols-2">
                {ENDO.map((k) => <Input key={k} label={k} disabled={lecture} value={f.endobuccal[k] ?? ""} onChange={(e) => maj({ endobuccal: { ...f.endobuccal, [k]: e.target.value } })} />)}
              </div>
            </section>
            <section>
              <p className="eyebrow mb-4">Odontogramme</p>
              <Odontogramme value={f.odontogramme} lecture={lecture} onChange={(v) => maj({ odontogramme: v })} />
            </section>
            <section className="grid gap-4">
              <Textarea label="Examen du M/C" disabled={lecture} value={f.examenMc} onChange={(e) => maj({ examenMc: e.target.value })} />
              <Textarea label="Examens complémentaires" disabled={lecture} value={f.examensComplementaires} onChange={(e) => maj({ examensComplementaires: e.target.value })} />
              <Textarea label="Commentaire sur les examens complémentaires" disabled={lecture} value={f.commentaireExamens} onChange={(e) => maj({ commentaireExamens: e.target.value })} />
            </section>
          </div>
        )}

        {onglet === "diagnostic" && (
          <div className="grid gap-4">
            <Textarea label="Diagnostic" rows={4} disabled={lecture} value={f.diagnostic} onChange={(e) => maj({ diagnostic: e.target.value })} />
            <Textarea label="C.A.T. (conduite à tenir)" rows={5} disabled={lecture} value={f.cat} onChange={(e) => maj({ cat: e.target.value })} />
          </div>
        )}

        {onglet === "suivi" && (
          <div className="-m-6">
            <CardTitle eyebrow="Historique des soins" title="Fiche de suivi des soins" />
            {liste.length ? (
              <ul className="divide-y divide-line">
                {liste.map((s) => (
                  <li key={s.id} className="grid gap-x-4 gap-y-1 px-5 py-4 text-sm md:grid-cols-[100px_80px_1.5fr_1fr_1fr_1fr]">
                    <span className="num font-semibold">{formatDateFr(s.dateSoin)}</span>
                    <span className="num text-mute">Dent {s.dents}</span>
                    <span className="min-w-0">{s.natureActes}<span className="block text-xs text-mute">{s.praticien}</span></span>
                    <span className="num">{formatFcfa(s.montantPaye)} <span className="text-xs text-mute">payés</span></span>
                    <span className={cn("num", s.montantTotal - s.montantPaye > 0 && "font-semibold text-danger")}>{formatFcfa(s.montantTotal - s.montantPaye)} <span className="text-xs text-mute">reste</span></span>
                    <span className="num text-mute">{s.dateProchainRdv ? `RDV ${formatDateFr(s.dateProchainRdv)}` : "—"}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="px-5 py-12 text-center text-sm text-faint">Aucun soin enregistré.</p>}
            {peutEditer && <div className="border-t border-line p-5"><SoinForm patient={p} onSaved={recharger} /></div>}
          </div>
        )}

        {onglet !== "suivi" && !lecture && (
          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-6">
            <Button onClick={enregistrer} loading={saving}><IconSave size={16} />Enregistrer</Button>
            {idx < ONGLETS.length - 1 && <Button variant="outline" onClick={() => setOnglet(ONGLETS[idx + 1][0])}>Onglet suivant<IconArrowRight size={16} /></Button>}
            {msg && <span role="status" className="text-sm text-mute">{msg}</span>}
          </div>
        )}
      </Card>

      {f.historique.length > 0 && (
        <Card className="mt-6 overflow-hidden">
          <CardTitle eyebrow="Traçabilité" title="Historique des modifications" />
          <ul className="divide-y divide-line">
            {f.historique.slice(-5).reverse().map((h, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-4 px-5 py-3 text-sm">
                <span className="num w-36 text-mute">{formatDateFr(h.date)} {new Date(h.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="font-medium">{h.par}</span><span className="text-mute">{h.resume}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
