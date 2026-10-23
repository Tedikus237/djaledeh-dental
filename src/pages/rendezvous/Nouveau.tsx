import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { collection } from "@/data/db";
import type { RendezVous, Patient, Compte } from "@/types";

const rdvDb = collection<RendezVous>("rendezVous");
const patientDb = collection<Patient>("patients");
const compteDb = collection<Compte>("comptes");

export default function NouveauRDV() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [docteurs, setDocteurs] = useState<Compte[]>([]);

  // On utilise les noms exacts de ton interface RendezVous
  const [formData, setFormData] = useState({
    patientId: "",
    docteurId: "",
    dateRdv: "",
    heureRdv: "",
    motif: "Consultation",
    dureeMinutes: 30,
  });

  useEffect(() => {
    const chargerOptions = async () => {
      const [tousPatients, tousComptes] = await Promise.all([
        patientDb.list(),
        compteDb.list()
      ]);
      setPatients(tousPatients.filter(p => !p.deletedAt));
      setDocteurs(tousComptes.filter(c => c.role === "docteur" || c.role === "admin"));
    };
    chargerOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.docteurId || !formData.dateRdv || !formData.heureRdv) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setLoading(true);
    try {
      await rdvDb.create({
        ...formData,
        statut: "planifie",
        createdAt: new Date().toISOString(),
      });
      navigate("/rendez-vous");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la création du rendez-vous.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Nouveau" title="Créer un rendez-vous" />
      
      <Card className="mt-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
            <select 
              required
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
              value={formData.patientId}
              onChange={(e) => setFormData({...formData, patientId: e.target.value})}
            >
              <option value="">-- Choisir un patient --</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.nom} {p.prenom} ({p.numeroDossier})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Docteur *</label>
            <select 
              required
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
              value={formData.docteurId}
              onChange={(e) => setFormData({...formData, docteurId: e.target.value})}
            >
              <option value="">-- Choisir un docteur --</option>
              {docteurs.map(d => (
                <option key={d.id} value={d.id}>{d.nom}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input 
                required
                type="date" 
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                value={formData.dateRdv}
                onChange={(e) => setFormData({...formData, dateRdv: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heure *</label>
              <input 
                required
                type="time" 
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                value={formData.heureRdv}
                onChange={(e) => setFormData({...formData, heureRdv: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motif</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
              value={formData.motif}
              onChange={(e) => setFormData({...formData, motif: e.target.value})}
              placeholder="Ex: Détartrage, Consultation..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durée (minutes)</label>
            <input 
              type="number" 
              step="15"
              min="15"
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
              value={formData.dureeMinutes}
              onChange={(e) => setFormData({...formData, dureeMinutes: parseInt(e.target.value)})}
            />
          </div>

          <div className="pt-4 flex items-center gap-4 border-t border-gray-100">
            <Button 
              type="button" 
              onClick={() => navigate("/rendez-vous")}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
            >
              {loading ? "Enregistrement..." : "Enregistrer le RDV"}
            </Button>
          </div>

        </form>
      </Card>
    </>
  );
}