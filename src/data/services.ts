import { collection, uid } from "./db";
import { firestoreAddDoctorAccess, firestoreCreateAppointment, isFirebaseBackend } from "./firebase";
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

export async function synchroniserAccesPatientsDocteurs(
  rendezVousExistants: RendezVous[],
  patientsExistants: Patient[],
  docteurIdsActifs: string[],
): Promise<number> {
  const docteursActifs = new Set(docteurIdsActifs);
  const affectations = new Map<string, Set<string>>();
  for (const rdv of rendezVousExistants) {
    if (!rdv.patientId || !docteursActifs.has(rdv.docteurId)) continue;
    const ids = affectations.get(rdv.patientId) ?? new Set<string>();
    ids.add(rdv.docteurId);
    affectations.set(rdv.patientId, ids);
  }

  const patientsParId = new Map(patientsExistants.map((patient) => [patient.id, patient]));
  let patientsModifies = 0;
  for (const [patientId, doctorIds] of affectations) {
    const patient = patientsParId.get(patientId);
    if (!patient || patient.deletedAt) continue;
    const dejaAffectes = new Set(patient.docteurIds ?? []);
    const nouveauxIds = [...doctorIds].filter((id) => !dejaAffectes.has(id));
    if (!nouveauxIds.length) continue;

    if (isFirebaseBackend()) {
      await firestoreAddDoctorAccess("patients", patientId, nouveauxIds);
    } else {
      await patients.update(patientId, { docteurIds: [...dejaAffectes, ...nouveauxIds] });
    }
    patientsModifies += 1;
  }
  return patientsModifies;
}

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
