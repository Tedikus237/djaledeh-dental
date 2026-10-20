import { useAuth } from "@/auth/AuthContext";
import { RdvList } from "@/components/RdvList";
import { Card, CardTitle, PageHeader } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { StatGrid } from "@/components/ui/Stat";
import { useDonnees } from "@/data/useDonnees";
import { isoDay } from "@/lib/dates";

export default function DashboardDocteur() {
  const d = useDonnees();
  const { user } = useAuth();
  if (!d || !user) return <PageSkeleton />;

  // Un administrateur qui consulte cette interface voit celle de Dr Paul.
  const moi = user.role === "docteur" ? user : d.comptes.find((c) => c.id === "u-drpaul") ?? user;
  const today = isoDay();
  const mes = d.rdvs.filter((r) => r.docteurId === moi.id).sort((a, b) => (a.dateRdv + a.heureRdv).localeCompare(b.dateRdv + b.heureRdv));
  const duJour = mes.filter((r) => r.dateRdv === today);
  const aVenir = mes.filter((r) => r.dateRdv > today);
  const patientsIds = Array.from(new Set(mes.map((r) => r.patientId)));

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
