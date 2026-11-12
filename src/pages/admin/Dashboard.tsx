import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconPlus } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, PageHeader } from "@/components/ui/Card";
import { RdvList } from "@/components/RdvList";
import { PageLoadError, PageSkeleton } from "@/components/ui/Skeleton";
import { StatGrid } from "@/components/ui/Stat";
import { synchroniserAccesPatientsDocteurs } from "@/data/services";
import { useDonnees } from "@/data/useDonnees";
import { isoDay } from "@/lib/dates";
import { formatFcfa } from "@/lib/utils";

const ROLE = { admin: "Administrateur", docteur: "Docteur", secretaire: "Secrétaire" } as const;

export default function DashboardAdmin() {
  const donnees = useDonnees();
  const nav = useNavigate();
  const [synchronisationEnCours, setSynchronisationEnCours] = useState(false);
  const [messageSynchronisation, setMessageSynchronisation] = useState("");
  const [erreurSynchronisation, setErreurSynchronisation] = useState("");
  if (donnees.status === "loading") return <PageSkeleton />;
  if (donnees.status === "error") return <PageLoadError error={donnees.error} />;
  const d = donnees.data;

  async function synchroniserAffectations() {
    if (!window.confirm("Associer chaque patient uniquement aux médecins indiqués dans ses rendez-vous enregistrés ?")) return;
    setSynchronisationEnCours(true);
    setMessageSynchronisation("");
    setErreurSynchronisation("");
    try {
      const modifies = await synchroniserAccesPatientsDocteurs(
        d.rdvs,
        d.patients,
        d.comptes.filter((compte) => compte.role === "docteur" && compte.actif).map((compte) => compte.id),
      );
      setMessageSynchronisation(
        modifies
          ? `Accès synchronisés pour ${modifies} patient(s) déjà attribué(s) à un médecin actif.`
          : "Aucune affectation à synchroniser.",
      );
    } catch (error) {
      setErreurSynchronisation(error instanceof Error ? error.message : "Impossible de synchroniser les accès des patients.");
    } finally {
      setSynchronisationEnCours(false);
    }
  }

  const today = isoDay();
  const duJour = d.rdvs.filter((r) => r.dateRdv === today).sort((a, b) => a.heureRdv.localeCompare(b.heureRdv));
  const recettes = d.factures.reduce((s, f) => s + f.montantPaye, 0);
  const reste = d.factures.reduce((s, f) => s + f.montantTotal - f.montantPaye, 0);
  const echoues = d.rappels.filter((w) => w.statut === "echoue").length;

  return (
    <>
      <PageHeader eyebrow="Vue d'ensemble" title="Bonjour Dr Deffo">
        <Button onClick={() => nav("/patients/nouveau")}><IconPlus size={16} />Nouveau patient</Button>
      </PageHeader>
      <StatGrid items={[
        { label: "Patients", value: d.patientsActifs.length },
        { label: "Rendez-vous du jour", value: duJour.length },
        { label: "Recettes encaissées", value: formatFcfa(recettes) },
        { label: "Impayés", value: formatFcfa(reste), danger: reste > 0 }
      ]} />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="animate-rise overflow-hidden">
          <CardTitle eyebrow="Aujourd'hui" title="Tous les rendez-vous" />
          <RdvList rows={duJour} patient={d.patient} docteur={d.docteur} vide="Aucun rendez-vous aujourd'hui." />
        </Card>
        <div className="space-y-6 self-start">
          <Card className="animate-rise overflow-hidden">
            <CardTitle eyebrow="À surveiller" title="Alertes" />
            <p className="px-5 py-4 text-sm">
              {echoues > 0 ? `${echoues} rappel(s) WhatsApp en échec.` : "Aucun rappel en échec."}
            </p>
          </Card>
          <Card className="animate-rise overflow-hidden">
            <CardTitle eyebrow="Équipe" title="Comptes" />
            <ul className="divide-y divide-line">
              {d.comptes.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
                  <span className="font-medium">{c.nom}</span><span className="text-xs text-faint">{ROLE[c.role]}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="animate-rise p-5">
            <CardTitle eyebrow="Accès médecins" title="Synchroniser les patients attribués" />
            <p className="mb-4 text-sm text-mute">Met à jour les accès sécurisés des patients déjà attribués dans leur dossier ou dans leurs rendez-vous, sans ouvrir l’accès aux autres patients.</p>
            <Button onClick={() => void synchroniserAffectations()} disabled={synchronisationEnCours}>
              {synchronisationEnCours ? "Synchronisation…" : "Synchroniser les affectations"}
            </Button>
            {messageSynchronisation && <p role="status" className="mt-3 text-sm text-emerald-800">{messageSynchronisation}</p>}
            {erreurSynchronisation && <p role="alert" className="mt-3 text-sm text-danger">{erreurSynchronisation}</p>}
          </Card>
        </div>
      </div>
    </>
  );
}
