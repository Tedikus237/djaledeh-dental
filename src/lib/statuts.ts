import type { StatutRdv } from "@/types";

export type Tone = "brand" | "ink" | "mute" | "danger";

export const statutRdv: Record<StatutRdv, { label: string; tone: Tone }> = {
  planifie: { label: "Planifié", tone: "ink" },
  confirme: { label: "Confirmé", tone: "brand" },
  annule: { label: "Annulé", tone: "mute" },
  termine: { label: "Terminé", tone: "mute" },
  absent: { label: "Absent", tone: "danger" }
};
