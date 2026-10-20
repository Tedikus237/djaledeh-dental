import type { Acte, Facture, Lettre, StatutFacture } from "@/types";

// Valeurs des lettres clés (nomenclature de l'ONCDC). « F » = prix direct en FCFA (le coefficient est le montant).
export const LETTRES: Record<Lettre, { label: string; valeur: number }> = {
  C: { label: "Consultation", valeur: 10000 },
  D: { label: "Soins dentaires", valeur: 1200 },
  DC: { label: "Actes chirurgicaux", valeur: 1200 },
  Z: { label: "Radiographies", valeur: 1200 },
  SC: { label: "Obturations composite", valeur: 1500 },
  SPR: { label: "Prothèses", valeur: 2000 },
  TO: { label: "Orthodontie", valeur: 1200 },
  F: { label: "Prix fixe (FCFA)", valeur: 1 }
};

export const prixAssure = (a: Acte) => a.coefficient * LETTRES[a.lettre].valeur;
export const prixActe = (a: Acte, assure: boolean) => (assure ? prixAssure(a) : a.prixNonAssure > 0 ? a.prixNonAssure : prixAssure(a));
export const libelleCode = (a: Acte) => (a.lettre === "F" ? "Prix fixe" : `${a.lettre}${a.coefficient}`);

export function repartition(total: number, assure: boolean, pct: number) {
  const partPatient = assure ? Math.round((total * pct) / 100) : total;
  return { partPatient, netEntreprise: total - partPatient };
}
export const statutDe = (total: number, paye: number): StatutFacture => (paye <= 0 ? "impaye" : paye >= total ? "paye" : "partiel");
export const reste = (f: Pick<Facture, "montantTotal" | "montantPaye">) => f.montantTotal - f.montantPaye;
export const payeParDe = (f: Facture, payeur: "patient" | "entreprise") =>
  f.paiements.filter((p) => p.payeur === payeur).reduce((s, p) => s + p.montant, 0);
