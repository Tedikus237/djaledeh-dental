import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db, collections } from "@/data/db";

import type { Patient, RendezVous, User, StatutRdv } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";

function isoLocalDateTime(date: string, heure: string): string {
  if (!date) return "";
  const [h, m] = (heure || "09:00").split(":");
  const d = new Date(`${date}T${h.padStart(2, "0")}:${(m || "00").padStart(2, "0")}:00`);
  return d.toISOString();
}

export default function NouveauRdv() {
  const navigate = useNavigate();
 
  const [params] = useSearchParams();
  const patientIdPre = params.get("patient") ?? "";

  const [patients, setPatients] = useState<Patient[]>([]);
  const [praticiens, setPraticiens] = useState<User[]>([]);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState("");

  const [form, setForm] = useState({
    patientId: patientIdPre,
    praticienId: "",
    date: new Date().toISOString().slice(0, 10),
    heure: "09:00",
    motif: "",
    statut: "a_confirmer" as StatutRdv,
  });

    useEffect(() => {
    (async () => {
      const [ps, us] = await Promise.all([
        db.list<Patient>(collections.patients),
        db.list<User>(collections.users),
      ]);
      ps.sort((a, b) => a.nom.localeCompare(b.nom));
      setPatients(ps);
      const docs = us.filter((u) => u.role === "docteur" || u.role === "admin");
      setPraticiens(docs);
      setForm((f) => (f.praticienId ? f : { ...f, praticienId: docs[0]?.id ?? "" }));
    })();
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur("");
    if (!form.patientId) return setErreur("Sélectionnez un patient.");
    if (!form.praticienId) return setErreur("Sélectionnez un praticien.");
    if (!form.date || !form.heure) return setErreur("Date et heure obligatoires.");

    setEnregistrement(true);
    try {
      const iso = isoLocalDateTime(form.date, form.heure);
      await db.create<RendezVous>(collections.rdvs, {
        patientId: form.patientId,
        praticienId: form.praticienId,
        date: iso,
        motif: form.motif.trim(),
        statut: form.statut,
        createdAt: new Date().toISOString(),
      });
      navigate("/");
    } catch {
      setErreur("Erreur lors de l'enregistrement.");
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8 max-w-2xl">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
          Rendez-vous
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
          Nouveau rendez-vous
        </h1>
      </header>

      <Card title="Informations" accent="accent">
        <div className="grid gap-5">
          <Select
            label="Patient"
            value={form.patientId}
            onChange={(e) => set("patientId", e.target.value)}
            required
          >
            <option value="">— Sélectionner —</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom} {p.prenom} — {p.numeroDossier}
              </option>
            ))}
          </Select>

          <Select
            label="Praticien"
            value={form.praticienId}
            onChange={(e) => set("praticienId", e.target.value)}
            required
          >
            <option value="">— Sélectionner —</option>
            {praticiens.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nom}
              </option>
            ))}
          </Select>

          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              required
            />
            <Input
              label="Heure"
              type="time"
              value={form.heure}
              onChange={(e) => set("heure", e.target.value)}
              required
            />
          </div>

          <Select
            label="Statut"
            value={form.statut}
            onChange={(e) => set("statut", e.target.value as StatutRdv)}
          >
            <option value="a_confirmer">À confirmer</option>
            <option value="confirme">Confirmé</option>
          </Select>

          <Textarea
            label="Motif"
            value={form.motif}
            onChange={(e) => set("motif", e.target.value)}
            placeholder="Ex : Traitement carie 36"
          />
        </div>
      </Card>

      {erreur && <p className="text-sm text-danger">{erreur}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={enregistrement}>
          {enregistrement ? "Enregistrement..." : "Enregistrer le rendez-vous"}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Annuler
        </Button>
      </div>
    </form>
  );
}