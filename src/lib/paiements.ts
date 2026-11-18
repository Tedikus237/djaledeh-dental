import type { ModePaiement } from "@/types";

export const MODES: Record<ModePaiement, string> = {
  especes: "Espèces",
  mobile_money: "Mobile money",
  assurance: "Assurance",
  autre: "Autre",
};
