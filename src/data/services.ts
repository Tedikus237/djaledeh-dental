import { collection, uid } from "./db";
import { firestoreCreateAppointment, isFirebaseBackend } from "./firebase";
import type { Acte, Compte, DossierMedical, Entreprise, Facture, Patient, RappelWhatsapp, RendezVous, Soin } from "@/types";

export const comptes = collection<Compte>("comptes");
export const patients = collection<Patient>("patients");
export const rdvs = collection<RendezVous>("rdvs");
export const rendezVous = collection<RendezVous>("rendezVous");
export const factures = collection<Facture>("factures");
export const rappels = collection<RappelWhatsapp>("rappels");
export const dossiers = collection<DossierMedical>("dossiers");
export const soins = collection<Soin>("soins");
export const actes = collection<Acte>("actes");
export const entreprises = collection<Entreprise>("entreprises");

export async function createRendezVous(data: Omit<RendezVous, "id">): Promise<RendezVous> {
  if (isFirebaseBackend()) {
    return firestoreCreateAppointment<RendezVous>(uid(), data);
  }

  const patient = await patients.get(data.patientId);
  if (!patient) throw new Error("Le patient sélectionné n'existe plus.");
  const appointment = await rendezVous.create(data);
  const docteurIds = Array.from(new Set([...(patient.docteurIds ?? []), data.docteurId]));
  await patients.update(patient.id, { docteurIds });
  return appointment;
}
