import { useAsync } from "@/lib/useAsync";
import { useAuth } from "@/auth/AuthContext";
import { actes, comptes, entreprises, factures, patients, patientsDuDocteur, rappels, rdvs, rendezVous, soins } from "./services";

async function avecContexte<T>(collection: string, lecture: Promise<T>): Promise<T> {
  try {
    return await lecture;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Erreur inconnue";
    throw new Error(`Lecture refusée pour « ${collection} » : ${detail}`, { cause: error });
  }
}

export function useDonnees({ toleratePatientReadError = false }: { toleratePatientReadError?: boolean } = {}) {
  const { user, role, viewAsDoctor } = useAuth();
  return useAsync(async () => {
    const estDocteur = role === "docteur";
    const filtreDocteur = user?.role === "docteur" ? user.id : viewAsDoctor?.id ?? "";
    const patientsPromise = avecContexte("patients", estDocteur ? patientsDuDocteur(filtreDocteur) : patients.list())
      .then((patients) => ({ patients, error: null as Error | null }))
      .catch((error: unknown) => {
        if (!toleratePatientReadError) throw error;
        return {
          patients: [],
          error: error instanceof Error ? error : new Error("Une erreur inconnue est survenue pendant le chargement des patients."),
        };
      });
    const [legacyRdvs, cabinetRdvs, patientResult, c, f, w, s, a, e] = await Promise.all([
      avecContexte("rdvs", rdvs.list(estDocteur ? [{ field: "docteurId", operator: "==", value: filtreDocteur }] : [])),
      avecContexte("rendezVous", rendezVous.list(estDocteur ? [{ field: "docteurId", operator: "==", value: filtreDocteur }] : [])),
      patientsPromise,
      estDocteur ? Promise.resolve(viewAsDoctor ? [viewAsDoctor] : user?.role === "docteur" ? [user] : []) : avecContexte("comptes", comptes.list()),
      estDocteur ? Promise.resolve([]) : avecContexte("factures", factures.list()),
      estDocteur ? Promise.resolve([]) : avecContexte("rappels", rappels.list()),
      estDocteur ? Promise.resolve([]) : avecContexte("soins", soins.list()),
      estDocteur ? Promise.resolve([]) : avecContexte("actes", actes.list()),
      estDocteur ? Promise.resolve([]) : avecContexte("entreprises", entreprises.list()),
    ]);
    const { patients: p, error: patientsError } = patientResult;
    const r = [...legacyRdvs, ...cabinetRdvs];
    return {
      rdvs: r, patients: p, patientsActifs: p.filter((x) => !x.deletedAt), patientsError, comptes: c, factures: f, rappels: w, dossiers: [], soins: s, actes: a, entreprises: e,
      patient: (id: string) => { const x = p.find((y) => y.id === id); return x ? `${x.prenom} ${x.nom}` : "Patient inconnu"; },
      docteur: (id: string) => c.find((y) => y.id === id)?.nom ?? "—"
    };
  });
}
export type Donnees = Extract<ReturnType<typeof useDonnees>, { status: "success" }>["data"];
