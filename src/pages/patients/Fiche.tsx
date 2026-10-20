import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAcces } from "@/auth/useAcces";
import { IconCalendar, IconFile, IconPrint, IconTrash } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, PageHeader } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { Status } from "@/components/ui/Status";
import { patients } from "@/data/services";
import { useDonnees } from "@/data/useDonnees";
import { statutRdv, type Tone } from "@/lib/statuts";
import { cn, formatDateFr, formatFcfa } from "@/lib/utils";
import type { StatutFacture } from "@/types";

type Onglet = "dossier" | "rdv" | "factures";
const STATUT_F: Record<StatutFacture, { label: string; tone: Tone }> = {
  paye: { label: "Payée", tone: "brand" }, partiel: { label: "Partielle", tone: "ink" }, impaye: { label: "Impayée", tone: "danger" }
};

export default function FichePatient() {
  const { id = "" } = useParams();
  const d = useDonnees();
  const nav = useNavigate();
  const { docteurId, peutEditer } = useAcces();
  const [onglet, setOnglet] = useState<Onglet>("dossier");
  const [erreur, setErreur] = useState("");
  if (!d) return <PageSkeleton />;

  const p = d.patients.find((x) => x.id === id);
  if (!p) return <Card className="p-10 text-center text-sm text-mute">Patient introuvable.</Card>;
  if (docteurId && !d.rdvs.some((r) => r.patientId === id && r.docteurId === docteurId))
    return <Card className="p-10 text-center text-sm text-mute">Ce patient n'a pas de rendez-vous avec vous : accès non autorisé.</Card>;
  if (p.deletedAt) return (
    <Card className="p-10 text-center">
      <p className="text-sm text-mute">Ce patient se trouve dans la corbeille.</p>
      <Button variant="outline" className="mt-4" onClick={() => nav(peutEditer ? "/patients/corbeille" : "/patients")}>
        Retour
      </Button>
    </Card>
  );

  const rdvsP = d.rdvs.filter((r) => r.patientId === id).sort((a, b) => (b.dateRdv + b.heureRdv).localeCompare(a.dateRdv + a.heureRdv));
  const facs = d.factures.filter((f) => f.patientId === id);
  const dossier = d.dossiers.find((x) => x.patientId === id);
  const nomPatient = `${p.prenom} ${p.nom}`;
  async function mettreEnCorbeille() {
    if (!window.confirm(`Déplacer le dossier de ${nomPatient} dans la corbeille ? Ses rendez-vous, factures et données médicales seront conservés.`)) return;
    setErreur("");
    try {
      await patients.update(id, { deletedAt: new Date().toISOString() });
      nav("/patients", { replace: true });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Impossible de déplacer ce patient dans la corbeille.");
    }
  }
  const infos: [string, string][] = [
    ["Né(e) le", `${formatDateFr(p.dateNaissance)}${p.lieuNaissance ? " à " + p.lieuNaissance : ""}`],
    ["Âge", `${p.age} ans`], ["Téléphone", p.telephone], ["Résidence", p.residence || "—"],
    ["Profession", p.profession || "—"], ["Situation matrimoniale", p.situationMatrimoniale],
    ["Assurance", p.natureConsultation === "assurance" ? p.assuranceNom || p.assurance || "Oui" : p.assurance || "Aucune"],
    ["Personne à prévenir", p.personneUrgence || "—"]
  ];
  const ONGLETS: [Onglet, string][] = [["dossier", "Dossier médical"], ["rdv", "Rendez-vous"], ["factures", "Factures"]];

  return (
    <>
      <PageHeader eyebrow={p.numeroDossier} title={`${p.prenom} ${p.nom}`}>
        <Button variant="outline" onClick={() => window.print()}><IconPrint size={16} />Imprimer</Button>
        {peutEditer && <Button variant="outline" onClick={() => nav(`/rendez-vous/nouveau?patient=${id}`)}><IconCalendar size={16} />Prendre RDV</Button>}
        {peutEditer && <Button variant="outline" onClick={mettreEnCorbeille}><IconTrash size={16} />Mettre à la corbeille</Button>}
        <Button onClick={() => nav(`/patients/${id}/dossier`)}><IconFile size={16} />Dossier médical</Button>
      </PageHeader>
      {erreur && <p role="alert" className="mb-4 text-sm text-danger">{erreur}</p>}

      <Card className="mb-6 animate-rise">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line md:grid-cols-4">
          {infos.map(([k, v]) => (
            <div key={k} className="bg-white p-4"><dt className="text-xs text-mute">{k}</dt><dd className="mt-1 text-sm font-semibold">{v}</dd></div>
          ))}
        </dl>
      </Card>

      <div className="mb-4 flex gap-1 border-b border-line print:hidden" role="tablist">
        {ONGLETS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={onglet === k} onClick={() => setOnglet(k)}
            className={cn("-mb-px h-11 border-b-2 px-4 text-sm font-medium transition-colors", onglet === k ? "border-ink text-ink" : "border-transparent text-mute hover:text-ink")}>{l}</button>
        ))}
      </div>

      <Card className="animate-rise overflow-hidden">
        {onglet === "dossier" && (
          dossier ? (
            <div className="space-y-4 p-5 text-sm">
              <p><span className="text-mute">Dernière consultation :</span> <b>{formatDateFr(dossier.dateConsultation)}</b></p>
              <p><span className="text-mute">Motif :</span> {dossier.motif || "—"}</p>
              <p><span className="text-mute">Diagnostic :</span> {dossier.diagnostic || "—"}</p>
              <Button variant="outline" onClick={() => nav(`/patients/${id}/dossier`)}>Ouvrir le dossier complet</Button>
            </div>
          ) : <p className="px-5 py-12 text-center text-sm text-faint">Aucun dossier médical pour ce patient.</p>
        )}
        {onglet === "rdv" && (
          rdvsP.length ? (
            <ul className="divide-y divide-line">
              {rdvsP.map((r) => (
                <li key={r.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="num w-28 text-sm font-semibold">{formatDateFr(r.dateRdv)} {r.heureRdv}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-mute">{d.docteur(r.docteurId)} · {r.motif}</span>
                  <Status tone={statutRdv[r.statut].tone}>{statutRdv[r.statut].label}</Status>
                </li>
              ))}
            </ul>
          ) : <p className="px-5 py-12 text-center text-sm text-faint">Aucun rendez-vous.</p>
        )}
        {onglet === "factures" && (
          <>
            <CardTitle title="Factures du patient" />
            {facs.length ? (
              <ul className="divide-y divide-line">
                {facs.map((f) => (
                  <li key={f.id} className="flex items-center gap-4 px-5 py-4 text-sm">
                    <span className="num w-20 font-semibold">{f.numero}</span>
                    <span className="num flex-1 text-mute">{formatFcfa(f.montantPaye)} payés sur {formatFcfa(f.montantTotal)}</span>
                    <Status tone={STATUT_F[f.statut].tone}>{STATUT_F[f.statut].label}</Status>
                  </li>
                ))}
              </ul>
            ) : <p className="px-5 py-12 text-center text-sm text-faint">Aucune facture.</p>}
          </>
        )}
      </Card>
    </>
  );
}
