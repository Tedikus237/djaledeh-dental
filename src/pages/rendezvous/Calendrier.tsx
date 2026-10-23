import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { collection } from "@/data/db";
import type { RendezVous, Patient, StatutRdv } from "@/types";

const rdvDb = collection<RendezVous>("rendezVous");
const patientDb = collection<Patient>("patients");

export default function Calendrier() {
  const [rdvs, setRdvs] = useState<(RendezVous & { patientNom?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const chargerDonnees = async () => {
      const [listeRdvs, listePatients] = await Promise.all([
        rdvDb.list(),
        patientDb.list()
      ]);

      const rdvsAvecNoms = listeRdvs.map(rdv => {
        const patient = listePatients.find(p => p.id === rdv.patientId);
        return { 
          ...rdv, 
          patientNom: patient ? `${patient.nom} ${patient.prenom}` : "Patient inconnu" 
        };
      });

      // Tri par date puis par heure
      rdvsAvecNoms.sort((a, b) => `${a.dateRdv} ${a.heureRdv}`.localeCompare(`${b.dateRdv} ${b.heureRdv}`));
      
      setRdvs(rdvsAvecNoms);
      setLoading(false);
    };

    chargerDonnees();
  }, []);

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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}