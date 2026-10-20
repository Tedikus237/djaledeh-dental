import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import { patients } from "@/data/services";
import { calculerAge, cn } from "@/lib/utils";
import type { NatureConsultation, Patient } from "@/types";

const VIDE = { nom: "", prenom: "", dateNaissance: "", lieuNaissance: "", profession: "", residence: "", situationMatrimoniale: "Célibataire", telephone: "", assurance: "", personneUrgence: "", assuranceNom: "" };

export default function NouveauPatient() {
  const nav = useNavigate();
  const [f, setF] = useState(VIDE);
  const [nature, setNature] = useState<NatureConsultation>("standard");
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const maj = (k: keyof typeof VIDE) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const age = f.dateNaissance ? calculerAge(f.dateNaissance) : null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!f.nom.trim()) er.nom = "Le nom est obligatoire.";
    if (!f.prenom.trim()) er.prenom = "Le prénom est obligatoire.";
    if (!f.dateNaissance) er.dateNaissance = "La date de naissance est obligatoire.";
    else if (new Date(f.dateNaissance) > new Date()) er.dateNaissance = "La date ne peut pas être dans le futur.";
    if (!f.telephone.trim()) er.telephone = "Le téléphone est obligatoire.";
    else if (f.telephone.replace(/\D/g, "").length < 8) er.telephone = "Numéro trop court.";
    if (nature === "assurance" && !f.assuranceNom.trim()) er.assuranceNom = "Indiquez le nom de l'assurance.";
    setErrs(er);
    if (Object.keys(er).length) return;

    setLoading(true);
    const tous = await patients.list();
    const max = tous.reduce((m, p) => Math.max(m, Number(p.numeroDossier.split("-").pop()) || 0), 0);
    const p = await patients.create({
      ...f, nom: f.nom.trim(), prenom: f.prenom.trim(), age: calculerAge(f.dateNaissance), natureConsultation: nature,
      numeroDossier: `DJ-${new Date().getFullYear()}-${String(max + 1).padStart(4, "0")}`,
      createdAt: new Date().toISOString()
    } as Omit<Patient, "id">);
    nav(`/patients/${p.id}`, { replace: true });
  }

  const NATURES: [NatureConsultation, string][] = [["standard", "Standard"], ["express", "Express"], ["assurance", "Assurance"]];

  return (
    <>
      <PageHeader eyebrow="Patients" title="Nouveau patient" />
      <form onSubmit={submit} noValidate>
        <Card className="animate-rise p-6">
          <p className="eyebrow mb-4">Identification</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Nom" value={f.nom} onChange={maj("nom")} error={errs.nom} />
            <Input label="Prénom" value={f.prenom} onChange={maj("prenom")} error={errs.prenom} />
            <Input label="Né(e) le" type="date" value={f.dateNaissance} onChange={maj("dateNaissance")} error={errs.dateNaissance} />
            <Input label="Lieu de naissance" value={f.lieuNaissance} onChange={maj("lieuNaissance")} />
            <div><label className="mb-1.5 block text-[13px] font-medium">Âge</label><div className="num flex h-11 items-center rounded-xl bg-canvas px-3.5 text-sm text-mute">{age === null ? "Calculé à partir de la date de naissance" : `${age} ans`}</div></div>
            <Input label="Profession" value={f.profession} onChange={maj("profession")} />
            <Input label="Résidence" value={f.residence} onChange={maj("residence")} />
            <Select label="Situation matrimoniale" value={f.situationMatrimoniale} onChange={maj("situationMatrimoniale")}>
              {["Célibataire", "Marié(e)", "Divorcé(e)", "Veuf(ve)"].map((s) => <option key={s}>{s}</option>)}
            </Select>
            <Input label="Numéro de téléphone" type="tel" value={f.telephone} onChange={maj("telephone")} error={errs.telephone} />
            <Input label="Assurance" value={f.assurance} onChange={maj("assurance")} />
            <div className="md:col-span-2"><Input label="Personne à prévenir en cas d'urgence et numéro" value={f.personneUrgence} onChange={maj("personneUrgence")} /></div>
          </div>

          <p className="eyebrow mb-3 mt-8">Nature de la consultation</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Nature de la consultation">
            {NATURES.map(([v, l]) => (
              <button key={v} type="button" role="radio" aria-checked={nature === v} onClick={() => setNature(v)}
                className={cn("h-11 rounded-xl border px-5 text-sm font-medium transition-colors md:h-10", nature === v ? "border-ink bg-ink text-white" : "border-line bg-white text-mute hover:text-ink")}>{l}</button>
            ))}
          </div>
          {nature === "assurance" && <div className="mt-4 max-w-sm"><Input label="Nom de l'assurance" value={f.assuranceNom} onChange={maj("assuranceNom")} error={errs.assuranceNom} /></div>}

          <div className="mt-8 flex gap-3 border-t border-line pt-6">
            <Button type="submit" loading={loading}>Enregistrer</Button>
            <Button type="button" variant="outline" onClick={() => nav("/patients")}>Annuler</Button>
          </div>
          <p className="mt-3 text-xs text-faint">Le numéro de dossier est généré automatiquement à l'enregistrement.</p>
        </Card>
      </form>
    </>
  );
}
