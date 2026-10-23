export type Role = "admin" | "docteur" | "secretaire";

export interface Compte {
  id: string; identifiant: string; alias: string[]; nom: string;
  role: Role; password: string; actif: boolean; createdAt: string;
}

export type NatureConsultation = "standard" | "express" | "assurance" | "Assurance" | string;
export type SituationMatrimoniale = "celibataire" | "marie" | "divorce" | "veuf" | string;

export interface Patient {
  id: string; numeroDossier: string; nom: string; prenom: string;
  dateNaissance: string; lieuNaissance: string; age: number;
  profession: string; residence: string; situationMatrimoniale: SituationMatrimoniale;
  telephone: string; assurance: string; personneUrgence: string;
  personneAPrevenir?: string; telephonePersonneAPrevenir?: string;
  natureConsultation: NatureConsultation; 
  assuranceNom?: string; nomAssurance?: string; 
  motifConsultation?: string; histoireMaladie?: string; antecedents?: string;
  createdAt: string; updatedAt?: string; deletedAt?: string;
}

export type StatutRdv = "planifie" | "confirme" | "annule" | "termine" | "absent";
export interface RendezVous {
  id: string; patientId: string; docteurId: string; dateRdv: string; heureRdv: string;
  dureeMinutes: number; motif: string; statut: StatutRdv; createdAt: string;
}

export interface RappelWhatsapp {
  id: string; rdvId: string; patientId: string;
  statut: "programme" | "envoye" | "echoue" | "confirme" | "annule"; datePrevue: string;
}

export type CodeDent = "C" | "A" | "O" | "DR" | "DC" | "M" | "PP";
export interface DentState {
  numero: number | string;
  codes: CodeDent[];
}

export interface Modif { date: string; par: string; resume: string }

export interface SoinLigne {
  id: string;
  date: string;
  dents: string;
  natureActes: string;
  montantActe: number;
  montantPaye: number;
  resteAPayer: number;
  dateRdv: string;
  praticienId: string;
}

export interface LigneSoin {
  acteId: string;
  code: string;
  libelle: string;
  qte: number;
  montant: number;
}

export interface DossierMedical {
  id: string; patientId: string; dateConsultation: string;
  motif: string; histoireMaladie: string; antecedents: string;
  exobuccal: Record<string, string>; endobuccal: Record<string, string>;
  examen: Record<string, unknown>;
  examenMc: string; examensComplementaires: string; commentaireExamens: string;
  diagnostic: unknown;
  cat: string;
  odontogramme: unknown;
  soins: SoinLigne[];
  historique: Modif[]; createdAt: string; updatedAt: string;
}

export type Lettre = "C" | "D" | "DC" | "Z" | "SC" | "SPR" | "TO" | "F";
export interface Acte {
  id: string; libelle: string; lettre: Lettre; coefficient: number;
  prixNonAssure: number; dureeMinutes: number; actif: boolean;
}
export interface Entreprise {
  id: string; nom: string; bp: string; contribuable: string; rccm: string; telephone: string;
  partPatient: number; bonRequis: boolean;
}
export type ModePaiement = "especes" | "mobile_money" | "assurance" | "autre";
export interface Paiement { id: string; date: string; montant: number; mode: ModePaiement; payeur: "patient" | "entreprise" }
export interface Soin {
  id: string; patientId: string; dateSoin: string; dents: string; natureActes: string;
  montantTotal: number; montantPaye: number; dateProchainRdv: string; praticien: string;
  lignes: LigneSoin[]; factureId: string; createdAt: string;
}
export type StatutFacture = "paye" | "partiel" | "impaye";
export interface Facture {
  id: string; numero: string; patientId: string; soinId: string; dateEmission: string;
  lignes: LigneSoin[]; montantTotal: number;
  entrepriseId: string; bonPriseEnCharge: string; partPatientPct: number; partPatient: number; netEntreprise: number;
  paiements: Paiement[]; montantPaye: number; statut: StatutFacture;
}