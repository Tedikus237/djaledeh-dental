import { useAuth } from "@/auth/AuthContext";
import { RdvList } from "@/components/RdvList";
import { Card, CardTitle, PageHeader } from "@/components/ui/Card";
import { PageLoadError, PageSkeleton } from "@/components/ui/Skeleton";
import { StatGrid } from "@/components/ui/Stat";
import { useDonnees } from "@/data/useDonnees";
import { isoDay } from "@/lib/dates";

export default function DashboardDocteur() {
  const donnees = useDonnees();
  const { user, viewAsDoctor } = useAuth();
  if (donnees.status === "loading") return <PageSkeleton />;
  if (donnees.status === "error") return <PageLoadError error={donnees.error} />;
  const d = donnees.data;
  if (!user) return <PageSkeleton />;

  const moi = user.role === "docteur"
    ? user
    : viewAsDoctor ?? d.comptes.find((c) => c.role === "docteur" && c.actif);
  if (!moi) return <PageLoadError error={new Error("Aucun compte docteur actif n’est configuré pour cet aperçu.")} />;
  const today = isoDay();
  const mes = d.rdvs.filter((r) => r.docteurId === moi.id).sort((a, b) => (a.dateRdv + a.heureRdv).localeCompare(b.dateRdv + b.heureRdv));
  const duJour = mes.filter((r) => r.dateRdv === today);
  const aVenir = mes.filter((r) => r.dateRdv > today);
  const patientsIds = d.patientsActifs.map((patient) => patient.id);

  return (
    <>
      <PageHeader eyebrow="Tableau de bord" title={`Bonjour ${moi.nom}`} />
      <StatGrid items={[
        { label: "Mes rendez-vous aujourd'hui", value: duJour.length },
        { label: "Rendez-vous à venir", value: aVenir.length },
        { label: "Patients suivis", value: patientsIds.length },
        { label: "Terminés aujourd'hui", value: duJour.filter((r) => r.statut === "termine").length }
      ]} />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="animate-rise overflow-hidden">
          <CardTitle eyebrow="Aujourd'hui" title="Mes rendez-vous" />
          <RdvList rows={duJour} patient={d.patient} docteur={d.docteur} vide="Aucun rendez-vous aujourd'hui." />
        </Card>
        <Card className="animate-rise self-start overflow-hidden">
          <CardTitle eyebrow="Suivi" title="Mes patients" />
          <ul className="divide-y divide-line">
            {patientsIds.map((id) => (
              <li key={id} className="px-5 py-3.5 text-sm font-medium">{d.patient(id)}</li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
