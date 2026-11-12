import { collection, uid } from "./db";
import { firestoreAddDoctorAccess, firestoreCreateAppointment, firestoreList, firestoreSyncDoctorPatientAccess, isFirebaseBackend } from "./firebase";
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

export async function patientsDuDocteur(doctorId: string): Promise<Patient[]> {
  if (!isFirebaseBackend()) {
    return patients.list([{ field: "docteurIds", operator: "array-contains", value: doctorId }]);
  }
  const affectations = await firestoreList<{ id: string }>(`comptes/${doctorId}/patients`);
  const dossiers = await Promise.all(affectations.map(({ id }) => patients.get(id)));
  return dossiers.filter((patient): patient is Patient => patient !== null);
}

export async function synchroniserAccesPatientsDocteurs(
  rendezVousExistants: RendezVous[],
  patientsExistants: Patient[],
  docteurIdsActifs: string[],
): Promise<number> {
  const docteursActifs = new Set(docteurIdsActifs);
  const affectations = new Map<string, Set<string>>();
  for (const patient of patientsExistants) {
    if (patient.deletedAt) continue;
    for (const doctorId of patient.docteurIds ?? []) {
      if (!docteursActifs.has(doctorId)) continue;
      const ids = affectations.get(patient.id) ?? new Set<string>();
      ids.add(doctorId);
      affectations.set(patient.id, ids);
    }
  }
  for (const rdv of rendezVousExistants) {
    if (!rdv.patientId || !docteursActifs.has(rdv.docteurId)) continue;
    const ids = affectations.get(rdv.patientId) ?? new Set<string>();
    ids.add(rdv.docteurId);
    affectations.set(rdv.patientId, ids);
  }

  const patientsParId = new Map(patientsExistants.map((patient) => [patient.id, patient]));
  let patientsSynchronises = 0;
  const patientsParDocteur = new Map<string, string[]>();
  for (const [patientId, doctorIds] of affectations) {
    const patient = patientsParId.get(patientId);
    if (!patient || patient.deletedAt) continue;
    const dejaAffectes = new Set(patient.docteurIds ?? []);
    const nouveauxIds = [...doctorIds].filter((id) => !dejaAffectes.has(id));

    if (nouveauxIds.length) {
      if (isFirebaseBackend()) {
        await firestoreAddDoctorAccess("patients", patientId, nouveauxIds);
      } else {
        await patients.update(patientId, { docteurIds: [...dejaAffectes, ...nouveauxIds] });
      }
    }
    patientsSynchronises += 1;
    for (const doctorId of doctorIds) {
      const assignedPatients = patientsParDocteur.get(doctorId) ?? [];
      assignedPatients.push(patientId);
      patientsParDocteur.set(doctorId, assignedPatients);
    }
  }
  if (isFirebaseBackend()) {
    await Promise.all(
      [...patientsParDocteur].map(([doctorId, patientIds]) => firestoreSyncDoctorPatientAccess(doctorId, patientIds)),
    );
  }
  return patientsSynchronises;
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
