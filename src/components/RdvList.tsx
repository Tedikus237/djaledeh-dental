import { statutRdv } from "@/lib/statuts";
import type { RendezVous } from "@/types";
import { Status } from "./ui/Status";

interface Props { rows: RendezVous[]; patient: (id: string) => string; docteur: (id: string) => string; vide: string }

export function RdvList({ rows, patient, docteur, vide }: Props) {
  if (!rows.length) return <p className="px-5 py-10 text-center text-sm text-faint">{vide}</p>;
  return (
    <ul className="divide-y divide-line">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-4 px-5 py-4">
          <span className="num w-12 text-sm font-semibold">{r.heureRdv}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{patient(r.patientId)}</p>
            <p className="truncate text-xs text-mute">{docteur(r.docteurId)} · {r.motif}</p>
          </div>
          <Status tone={statutRdv[r.statut].tone}>{statutRdv[r.statut].label}</Status>
        </li>
      ))}
    </ul>
  );
}
