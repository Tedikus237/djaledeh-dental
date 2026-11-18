import type { Acte, CategorieSoin } from "@/types";

export const LIBELLE_CATEGORIE_SOIN: Record<CategorieSoin, string> = {
  prothese: "Prothèses",
  autres: "Autres soins",
};

export function categorieParLibelle(libelle: string): CategorieSoin {
  const normalise = libelle.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return /proth|couronne|bridge|implant/.test(normalise) ? "prothese" : "autres";
}

export function categorieActe(acte: Pick<Acte, "categorie" | "libelle" | "lettre">): CategorieSoin {
  return acte.categorie ?? (acte.lettre === "SPR" ? "prothese" : categorieParLibelle(acte.libelle));
}
