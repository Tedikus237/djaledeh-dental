import { useAsync } from "@/lib/useAsync";
import { useAuth } from "@/auth/AuthContext";
import { actes, comptes, dossiers, entreprises, factures, patients, rappels, rdvs, rendezVous, soins } from "./services";

export function useDonnees() {
  const { user } = useAuth();
  return useAsync(async () => {
    const estDocteur = user?.role === "docteur";
    const filtreDocteur = user?.id ?? "";
    const [legacyRdvs, cabinetRdvs, p, c, f, w, d, s, a, e] = await Promise.all([
      rdvs.list(estDocteur ? [{ field: "docteurId", operator: "==", value: filtreDocteur }] : []),
      rendezVous.list(estDocteur ? [{ field: "docteurId", operator: "==", value: filtreDocteur }] : []),
      patients.list(estDocteur ? [{ field: "docteurIds", operator: "array-contains", value: filtreDocteur }] : []),
      estDocteur ? Promise.resolve(user ? [user] : []) : comptes.list(),
      estDocteur ? Promise.resolve([]) : factures.list(),
      estDocteur ? Promise.resolve([]) : rappels.list(),
      dossiers.list(estDocteur ? [{ field: "docteurIds", operator: "array-contains", value: filtreDocteur }] : []),
      estDocteur ? Promise.resolve([]) : soins.list(),
      estDocteur ? Promise.resolve([]) : actes.list(),
      estDocteur ? Promise.resolve([]) : entreprises.list(),
    ]);
    const r = [...legacyRdvs, ...cabinetRdvs];
    return {
      rdvs: r, patients: p, patientsActifs: p.filter((x) => !x.deletedAt), comptes: c, factures: f, rappels: w, dossiers: d, soins: s, actes: a, entreprises: e,
      patient: (id: string) => { const x = p.find((y) => y.id === id); return x ? `${x.prenom} ${x.nom}` : "Patient inconnu"; },
      docteur: (id: string) => c.find((y) => y.id === id)?.nom ?? "—"
    };
  });
}
export type Donnees = Extract<ReturnType<typeof useDonnees>, { status: "success" }>["data"];
