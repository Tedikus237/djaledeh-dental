import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { IconPlus } from "@/components/icons";
import { RdvList } from "@/components/RdvList";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, PageHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { PageLoadError, PageSkeleton } from "@/components/ui/Skeleton";
import { StatGrid } from "@/components/ui/Stat";
import { depenses } from "@/data/services";
import { useDonnees } from "@/data/useDonnees";
import { addDays, isoDay } from "@/lib/dates";
import { formatFcfa } from "@/lib/utils";

export default function DashboardSecretaire() {
  const donnees = useDonnees();
  const nav = useNavigate();
  const { readOnly, user } = useAuth();
  const [dateDepense, setDateDepense] = useState(isoDay());
  const [libelleDepense, setLibelleDepense] = useState("");
  const [montantDepense, setMontantDepense] = useState("");
  const [depenseEnCours, setDepenseEnCours] = useState(false);
  const [erreurDepense, setErreurDepense] = useState("");
  const [messageDepense, setMessageDepense] = useState("");
  if (donnees.status === "loading") return <PageSkeleton />;
  if (donnees.status === "error") return <PageLoadError error={donnees.error} />;
  const d = donnees.data;

  const today = isoDay(), demain = addDays(1);
  const duJour = d.rdvs.filter((r) => r.dateRdv === today).sort((a, b) => a.heureRdv.localeCompare(b.heureRdv));
  const aConfirmer = d.rdvs.filter((r) => r.statut === "planifie" && r.dateRdv >= today);
  const programmes = d.rappels.filter((w) => w.statut === "programme").length;
  const echoues = d.rappels.filter((w) => w.statut === "echoue").length;
  const nonConfirmesDemain = d.rdvs.filter((r) => r.dateRdv === demain && r.statut === "planifie").length;
  const impayes = d.factures.filter((f) => f.statut !== "paye");
  const reste = impayes.reduce((s, f) => s + f.montantTotal - f.montantPaye, 0);

  async function enregistrerDepense() {
    const montant = Number(montantDepense);
    if (!dateDepense) return setErreurDepense("Sélectionnez la date de la dépense.");
    if (!libelleDepense.trim()) return setErreurDepense("Saisissez le libellé de la dépense.");
    if (!Number.isSafeInteger(montant) || montant <= 0) return setErreurDepense("Saisissez un montant entier supérieur à 0.");
    if (!user) return setErreurDepense("Votre session est expirée. Reconnectez-vous avant d’enregistrer la dépense.");
    setDepenseEnCours(true);
    setErreurDepense("");
    setMessageDepense("");
    try {
      await depenses.create({
        date: dateDepense,
        libelle: libelleDepense.trim(),
        montant,
        createdAt: new Date().toISOString(),
        createdBy: user.id,
      });
      setLibelleDepense("");
      setMontantDepense("");
      setMessageDepense("Dépense enregistrée. Elle apparaîtra dans le tableau financier.");
    } catch (error) {
      setErreurDepense(error instanceof Error ? error.message : "Impossible d’enregistrer cette dépense.");
    } finally {
      setDepenseEnCours(false);
    }
  }

  const alertes = [
    echoues > 0 && { t: `${echoues} rappel(s) WhatsApp en échec`, danger: true },
    nonConfirmesDemain > 0 && { t: `${nonConfirmesDemain} patient(s) n'ont pas confirmé leur rendez-vous de demain`, danger: false },
    impayes.length > 0 && { t: `${impayes.length} facture(s) à relancer`, danger: false }
  ].filter(Boolean) as { t: string; danger: boolean }[];

  return (
    <>
      <PageHeader eyebrow="Tableau de bord" title="Bonjour, voici votre journée">
        {!readOnly && <Button onClick={() => nav("/patients/nouveau")}><IconPlus size={16} />Nouveau patient</Button>}
      </PageHeader>
      <StatGrid items={[
        { label: "Rendez-vous du jour", value: duJour.length },
        { label: "À confirmer", value: aConfirmer.length },
        { label: "Rappels à envoyer", value: programmes },
        { label: "Impayés", value: formatFcfa(reste), danger: reste > 0 }
      ]} />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="animate-rise overflow-hidden">
          <CardTitle eyebrow="Aujourd'hui" title="Rendez-vous du jour" />
          <RdvList rows={duJour} patient={d.patient} docteur={d.docteur} vide="Aucun rendez-vous aujourd'hui." />
        </Card>
        <Card className="animate-rise self-start overflow-hidden">
          <CardTitle eyebrow="À traiter" title="Alertes" />
          {alertes.length ? (
            <ul className="divide-y divide-line">
              {alertes.map((a) => (
                <li key={a.t} className="flex items-start gap-3 px-5 py-4 text-sm">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${a.danger ? "bg-danger" : "bg-brand"}`} />{a.t}
                </li>
              ))}
            </ul>
          ) : <p className="px-5 py-10 text-center text-sm text-faint">Rien à signaler.</p>}
        </Card>
      </div>
      {!readOnly && (
        <Card className="mt-6 animate-rise p-5">
          <CardTitle eyebrow="Caisse" title="Enregistrer une dépense" />
          <p className="mb-4 text-sm text-mute">La dépense sera visible dans le tableau financier de l’administrateur.</p>
          <div className="grid gap-3 md:grid-cols-[1fr_2fr_1fr_auto] md:items-end">
            <Input label="Date" type="date" value={dateDepense} onChange={(event) => setDateDepense(event.target.value)} />
            <Input label="Libellé" placeholder="Ex. Fournitures de bureau" value={libelleDepense} onChange={(event) => setLibelleDepense(event.target.value)} />
            <Input label="Montant (FCFA)" type="number" min={1} step={1} value={montantDepense} onChange={(event) => setMontantDepense(event.target.value)} />
            <Button onClick={() => void enregistrerDepense()} disabled={depenseEnCours}>{depenseEnCours ? "Enregistrement…" : "Enregistrer"}</Button>
          </div>
          {erreurDepense && <p role="alert" className="mt-3 text-sm text-danger">{erreurDepense}</p>}
          {messageDepense && <p role="status" className="mt-3 text-sm text-emerald-800">{messageDepense}</p>}
        </Card>
      )}
    </>
  );
}
