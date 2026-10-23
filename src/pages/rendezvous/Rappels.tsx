import { useEffect, useState } from "react";
import { PageHeader, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { collection } from "@/data/db";
import type { RendezVous, Patient } from "@/types";

const rdvDb = collection<RendezVous>("rendezVous");
const patientDb = collection<Patient>("patients");

export default function Rappels() {
  const [rappels, setRappels] = useState<(RendezVous & { patient?: Patient })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const chargerRappels = async () => {
      const [tousRdvs, tousPatients] = await Promise.all([
        rdvDb.list(),
        patientDb.list()
      ]);

      // On garde uniquement les RDV planifiés ou confirmés
      const rdvsFuturs = tousRdvs.filter(r => r.statut === "planifie" || r.statut === "confirme");

      // On associe le patient à chaque RDV
      const rappelsAvecPatient = rdvsFuturs.map(rdv => {
        const patient = tousPatients.find(p => p.id === rdv.patientId);
        return { ...rdv, patient };
      });

      // On trie par date
      rappelsAvecPatient.sort((a, b) => `${a.dateRdv} ${a.heureRdv}`.localeCompare(`${b.dateRdv} ${b.heureRdv}`));
      
      setRappels(rappelsAvecPatient);
      setLoading(false);
    };

    chargerRappels();
  }, []);

  // Fonction pour ouvrir WhatsApp avec le message pré-rempli
  const notifierPatient = (rdv: RendezVous, patient?: Patient) => {
    if (!patient || !patient.telephone) {
      alert("Impossible : ce patient n'a pas de numéro de téléphone enregistré.");
      return;
    }

    // Nettoyage du numéro (on enlève les espaces et on s'assure qu'il commence par 237)
    let tel = patient.telephone.replace(/\s/g, "");
    if (!tel.startsWith("237")) {
      tel = "237" + tel;
    }

    // Message pré-rempli (comme défini dans le questionnaire)
    const message = `Bonjour M./Mme ${patient.nom}, je vous confirme votre rendez-vous le ${new Date(rdv.dateRdv).toLocaleDateString('fr-FR')} à ${rdv.heureRdv} au Cabinet Dentaire DJALEDEH, à côté de la Pharmacie Mère et Enfant, Garoua. Répondez 1 pour confirmer, 2 pour annuler.`;
    
    const url = `https://wa.me/${tel}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <>
      <PageHeader eyebrow="Communication" title="Rappels WhatsApp" />
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
        <p className="font-medium mb-1">Comment ça marche ?</p>
        <p>Cliquez sur "Notifier sur WhatsApp". L'application ouvre WhatsApp avec le message déjà écrit. Il vous suffit d'appuyer sur "Envoyer".</p>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Chargement des rappels...</div>
        ) : rappels.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Aucun rendez-vous à venir à notifier.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {rappels.map((rdv) => (
              <li key={rdv.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium text-gray-900 text-lg">
                    {rdv.patient ? `${rdv.patient.nom} ${rdv.patient.prenom}` : "Patient inconnu"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    RDV le <span className="font-medium text-gray-900">{new Date(rdv.dateRdv).toLocaleDateString('fr-FR')}</span> à <span className="font-medium text-gray-900">{rdv.heureRdv}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Tél : {rdv.patient?.telephone || "Non renseigné"}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button onClick={() => notifierPatient(rdv, rdv.patient)}>
                    Notifier sur WhatsApp
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}