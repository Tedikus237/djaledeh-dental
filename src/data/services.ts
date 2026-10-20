import { collection } from "./db";
import type { Acte, Compte, DossierMedical, Entreprise, Facture, Patient, RappelWhatsapp, RendezVous, Soin } from "@/types";

export const comptes = collection<Compte>("comptes");
export const patients = collection<Patient>("patients");
export const rdvs = collection<RendezVous>("rdvs");
export const factures = collection<Facture>("factures");
export const rappels = collection<RappelWhatsapp>("rappels");
export const dossiers = collection<DossierMedical>("dossiers");
export const soins = collection<Soin>("soins");
export const actes = collection<Acte>("actes");
export const entreprises = collection<Entreprise>("entreprises");
