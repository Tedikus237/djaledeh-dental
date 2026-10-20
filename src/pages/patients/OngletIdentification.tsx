import { useState, type FormEvent } from "react";
import { db, collections } from "@/data/db";
import type { Patient, NatureConsultation, SituationMatrimoniale } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Field";
import { calculerAge } from "@/lib/utils";

interface Props {
  patient: Patient;
  onSaved: (p: Patient) => void;
}

export function OngletIdentification({ patient, onSaved }: Props) {
  const [edition, setEdition] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [form, setForm] = useState(patient);

  function set<K extends keyof Patient>(key: K, value: Patient[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setEnregistrement(true);
    const updated = await db.update<Patient>(collections.patients, patient.id, {
      ...form,
      nom: form.nom.trim().toUpperCase(),
      updatedAt: new Date().toISOString(),
    });
    setEnregistrement(false);
    if (updated) {
      onSaved(updated);
      setEdition(false);
    }
  }

  function annuler() {
    setForm(patient);
    setEdition(false);
  }

  if (!edition) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setEdition(true)}>
            Modifier
          </Button>
        </div>
        <Ligne label="Nom" value={form.nom} />
        <Ligne label="Prénom" value={form.prenom} />
        <Ligne label="Né(e) le" value={form.dateNaissance} />
        <Ligne label="Lieu de naissance" value={form.lieuNaissance} />
        <Ligne label="Profession" value={form.profession} />
        <Ligne label="Résidence" value={form.residence} />
        <Ligne label="Situation matrimoniale" value={form.situationMatrimoniale} />
        <Ligne label="Téléphone" value={form.telephone} />
        <Ligne label="Assurance" value={form.assurance} />
        <Ligne label="Personne à prévenir" value={form.personneAPrevenir} />
        <Ligne label="Téléphone à prévenir" value={form.telephonePersonneAPrevenir} />
        <Ligne label="Nature de la consultation" value={form.natureConsultation} />
        {form.natureConsultation === "Assurance" && (
          <Ligne label="Nom de l'assurance" value={form.nomAssurance} />
        )}
        <Ligne label="Motif de consultation" value={form.motifConsultation} />
        <Ligne label="Histoire de la maladie" value={form.histoireMaladie} />
        <Ligne label="Antécédents" value={form.antecedents} />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={annuler}>
          Annuler
        </Button>
        <Button type="submit" size="sm" disabled={enregistrement}>
          {enregistrement ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>

      <Card title="Identité" accent="accent">
        <div className="grid gap-5 md:grid-cols-2">
          <Input label="Nom" value={form.nom} onChange={(e) => set("nom", e.target.value)} required />
          <Input label="Prénom" value={form.prenom} onChange={(e) => set("prenom", e.target.value)} required />
          <Input
            label="Né(e) le"
            type="date"
            value={form.dateNaissance}
            onChange={(e) => set("dateNaissance", e.target.value)}
            hint={form.dateNaissance ? `Âge : ${calculerAge(form.dateNaissance)} ans` : undefined}
          />
          <Input label="Lieu de naissance" value={form.lieuNaissance} onChange={(e) => set("lieuNaissance", e.target.value)} />
          <Input label="Profession" value={form.profession} onChange={(e) => set("profession", e.target.value)} />
          <Input label="Résidence" value={form.residence} onChange={(e) => set("residence", e.target.value)} />
          <Select
            label="Situation matrimoniale"
            value={form.situationMatrimoniale}
            onChange={(e) => set("situationMatrimoniale", e.target.value as SituationMatrimoniale)}
          >
            <option value="Celibataire">Célibataire</option>
            <option value="Marie(e)">Marié(e)</option>
            <option value="Divorce(e)">Divorcé(e)</option>
            <option value="Veuf(ve)">Veuf(ve)</option>
          </Select>
        </div>
      </Card>

      <Card title="Contacts" accent="accent">
        <div className="grid gap-5 md:grid-cols-2">
          <Input label="Téléphone" value={form.telephone} onChange={(e) => set("telephone", e.target.value)} />
          <Input label="Assurance" value={form.assurance} onChange={(e) => set("assurance", e.target.value)} />
          <Input label="Personne à prévenir" value={form.personneAPrevenir} onChange={(e) => set("personneAPrevenir", e.target.value)} />
          <Input label="Téléphone à prévenir" value={form.telephonePersonneAPrevenir} onChange={(e) => set("telephonePersonneAPrevenir", e.target.value)} />
        </div>
      </Card>

      <Card title="Consultation" accent="accent">
        <div className="grid gap-5 md:grid-cols-2">
          <Select
            label="Nature de la consultation"
            value={form.natureConsultation}
            onChange={(e) => set("natureConsultation", e.target.value as NatureConsultation)}
          >
            <option value="Standard">Standard</option>
            <option value="Express">Express</option>
            <option value="Assurance">Assurance</option>
          </Select>
          {form.natureConsultation === "Assurance" && (
            <Input label="Nom de l'assurance" value={form.nomAssurance} onChange={(e) => set("nomAssurance", e.target.value)} />
          )}
        </div>
        <div className="mt-5 grid gap-5">
          <Textarea label="Motif de consultation" value={form.motifConsultation} onChange={(e) => set("motifConsultation", e.target.value)} />
          <Textarea label="Histoire de la maladie" value={form.histoireMaladie} onChange={(e) => set("histoireMaladie", e.target.value)} />
          <Textarea label="Antécédents" value={form.antecedents} onChange={(e) => set("antecedents", e.target.value)} />
        </div>
      </Card>
    </form>
  );
}

function Ligne({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3 border-b border-line last:border-b-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
        {label}
      </p>
      <p className="mt-1 text-sm text-ink">{value || "—"}</p>
    </div>
  );
}