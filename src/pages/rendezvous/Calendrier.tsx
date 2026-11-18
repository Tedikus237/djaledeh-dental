import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useAcces } from "@/auth/useAcces";
import { PageHeader, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { confirmerRendezVous, patients, rdvs as anciennesVisites, rendezVous } from "@/data/services";
import type { RendezVous, StatutRdv } from "@/types";

type RendezVousPlanning = RendezVous & { patientNom?: string; source: "rdvs" | "rendezVous" };

export default function Calendrier() {
  const { docteurId, peutEditer } = useAcces();
  const { user } = useAuth();
  const [rdvs, setRdvs] = useState<RendezVousPlanning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [confirmationEnCours, setConfirmationEnCours] = useState("");

  useEffect(() => {
    const chargerDonnees = async () => {
      try {
        const filtreDocteur = docteurId
          ? [{ field: "docteurId", operator: "==" as const, value: docteurId }]
          : [];
        const filtrePatients = docteurId
          ? [{ field: "docteurIds", operator: "array-contains" as const, value: docteurId }]
          : [];
        const [anciens, nouveaux, listePatients] = await Promise.all([
          anciennesVisites.list(filtreDocteur),
          rendezVous.list(filtreDocteur),
          patients.list(filtrePatients),
        ]);
        const listeRdvs = [
          ...anciens.map((rdv) => ({ ...rdv, source: "rdvs" as const })),
          ...nouveaux.map((rdv) => ({ ...rdv, source: "rendezVous" as const })),
        ];

        const rdvsAvecNoms = listeRdvs.map(rdv => {
          const patient = listePatients.find(p => p.id === rdv.patientId);
          return {
            ...rdv,
            patientNom: patient ? `${patient.nom} ${patient.prenom}` : "Patient inconnu"
          };
        });

        rdvsAvecNoms.sort((a, b) => `${a.dateRdv} ${a.heureRdv}`.localeCompare(`${b.dateRdv} ${b.heureRdv}`));
        setRdvs(rdvsAvecNoms);
      } catch {
        setError("Impossible de charger le planning. Vérifiez votre connexion ou vos autorisations.");
      } finally {
        setLoading(false);
      }
    };

    void chargerDonnees();
  }, [docteurId]);

  async function confirmerClient(rdv: RendezVousPlanning) {
    if (!user || !peutEditer) return;
    setConfirmationEnCours(rdv.id);
    setActionError("");
    try {
      const confirmationClientLe = new Date().toISOString();
      await confirmerRendezVous(rdv.id, rdv.source, user.id);
      setRdvs((rows) => rows.map((row) => row.id === rdv.id
        ? { ...row, statut: "confirme", confirmationClientLe, confirmationClientPar: user.id }
        : row));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Impossible d’enregistrer la confirmation du client.");
    } finally {
      setConfirmationEnCours("");
    }
  }

  const getStatutBadge = (statut: StatutRdv) => {
    switch(statut) {
      case 'planifie': return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">Planifié</span>;
      case 'confirme': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Confirmé</span>;
      case 'annule': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">Annulé</span>;
      case 'termine': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">Terminé</span>;
      case 'absent': return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">Absent</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">Inconnu</span>;
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader eyebrow="Planning" title="Rendez-vous" />
        <Link to="/rendez-vous/nouveau">
          <Button>Nouveau rendez-vous</Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Chargement du planning...</div>
        ) : error ? (
          <div role="alert" className="p-8 text-center text-sm text-danger">{error}</div>
        ) : rdvs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <svg className="w-12 h-12 mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 mb-4">Aucun rendez-vous pour le moment.</p>
            <Link to="/rendez-vous/nouveau">
              <Button>Créer le premier RDV</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Heure</th>
                  <th className="px-6 py-3 font-medium">Patient</th>
                  <th className="px-6 py-3 font-medium">Motif</th>
                  <th className="px-6 py-3 font-medium">Statut</th>
                  {peutEditer && <th className="px-6 py-3 font-medium">Confirmation</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rdvs.map((rdv) => (
                  <tr key={rdv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {rdv.dateRdv ? new Date(rdv.dateRdv).toLocaleDateString('fr-FR') : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{rdv.heureRdv}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{rdv.patientNom}</td>
                    <td className="px-6 py-4 text-gray-500">{rdv.motif}</td>
                    <td className="px-6 py-4">{getStatutBadge(rdv.statut)}</td>
                    {peutEditer && (
                      <td className="px-6 py-4">
                        {rdv.statut === "planifie" ? (
                          <Button size="sm" disabled={confirmationEnCours === rdv.id} onClick={() => void confirmerClient(rdv)}>
                            {confirmationEnCours === rdv.id ? "Enregistrement…" : "Client a confirmé"}
                          </Button>
                        ) : rdv.confirmationClientLe ? (
                          <span title={`Enregistré le ${new Date(rdv.confirmationClientLe).toLocaleString("fr-FR")}`} className="text-xs text-mute">Confirmation enregistrée</span>
                        ) : <span className="text-xs text-mute">—</span>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {actionError && <p role="alert" className="border-t border-line px-5 py-3 text-sm text-danger">{actionError}</p>}
      </Card>
    </>
  );
}