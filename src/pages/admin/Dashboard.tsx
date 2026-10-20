import { Card, CardTitle, PageHeader } from "@/components/ui/Card";
import { RdvList } from "@/components/RdvList";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { StatGrid } from "@/components/ui/Stat";
import { useDonnees } from "@/data/useDonnees";
import { isoDay } from "@/lib/dates";
import { formatFcfa } from "@/lib/utils";

const ROLE = { admin: "Administrateur", docteur: "Docteur", secretaire: "Secrétaire" } as const;

export default function DashboardAdmin() {
  const d = useDonnees();
  if (!d) return <PageSkeleton />;

  const today = isoDay();
  const duJour = d.rdvs.filter((r) => r.dateRdv === today).sort((a, b) => a.heureRdv.localeCompare(b.heureRdv));
  const recettes = d.factures.reduce((s, f) => s + f.montantPaye, 0);
  const reste = d.factures.reduce((s, f) => s + f.montantTotal - f.montantPaye, 0);
  const echoues = d.rappels.filter((w) => w.statut === "echoue").length;

  return (
    <>
      <PageHeader eyebrow="Vue d'ensemble" title="Bonjour Dr Deffo" />
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
        </div>
      </div>
    </>
  );
}
