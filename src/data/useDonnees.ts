import { useAsync } from "@/lib/useAsync";
import { actes, comptes, dossiers, entreprises, factures, patients, rappels, rdvs, soins } from "./services";

export function useDonnees() {
  return useAsync(async () => {
    const [r, p, c, f, w, d, s, a, e] = await Promise.all([rdvs.list(), patients.list(), comptes.list(), factures.list(), rappels.list(), dossiers.list(), soins.list(), actes.list(), entreprises.list()]);
    return {
      rdvs: r, patients: p, patientsActifs: p.filter((x) => !x.deletedAt), comptes: c, factures: f, rappels: w, dossiers: d, soins: s, actes: a, entreprises: e,
      patient: (id: string) => { const x = p.find((y) => y.id === id); return x ? `${x.prenom} ${x.nom}` : "Patient inconnu"; },
      docteur: (id: string) => c.find((y) => y.id === id)?.nom ?? "—"
    };
  });
}
export type Donnees = NonNullable<ReturnType<typeof useDonnees>>;
