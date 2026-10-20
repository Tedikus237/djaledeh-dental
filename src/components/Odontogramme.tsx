import { useState } from "react";
import { cn } from "@/lib/utils";
import type { CodeDent } from "@/types";

export const CODES: { c: CodeDent; nom: string; couleur: string }[] = [
  { c: "C", nom: "Carie", couleur: "#FCD34D" },
  { c: "A", nom: "Absente", couleur: "#9CA3AF" },
  { c: "O", nom: "Obturée", couleur: "#60A5FA" },
  { c: "DR", nom: "Débris radiculaire", couleur: "#F87171" },
  { c: "DC", nom: "Délabrement coronaire", couleur: "#FB923C" },
  { c: "M", nom: "Mylolyse", couleur: "#A78BFA" },
  { c: "PP", nom: "Poche parodontale", couleur: "#34D399" }
];

const RANGEES: [number[], number[]][] = [
  [[18, 17, 16, 15, 14, 13, 12, 11], [21, 22, 23, 24, 25, 26, 27, 28]],
  [[55, 54, 53, 52, 51], [61, 62, 63, 64, 65]],
  [[85, 84, 83, 82, 81], [71, 72, 73, 74, 75]],
  [[48, 47, 46, 45, 44, 43, 42, 41], [31, 32, 33, 34, 35, 36, 37, 38]]
];

const TOOTH = "M12 3c-1.7 0-2.8 1-4 1-1.9 0-3.5 1.6-3.5 4 0 1.6.4 2.7.8 4.2.4 1.5.7 3.3 1.1 5.1.3 1.4.8 2.7 1.9 2.7.9 0 1-2.1 1.2-3.4.2-1.1.6-2 1.5-2s1.3.9 1.5 2c.2 1.3.3 3.4 1.2 3.4 1.1 0 1.6-1.3 1.9-2.7.4-1.8.7-3.6 1.1-5.1.4-1.5.8-2.6.8-4.2 0-2.4-1.6-4-3.5-4-1.2 0-2.3-1-4-1Z";

type Valeur = Record<string, CodeDent[]>;
interface Props { value: Valeur; onChange: (v: Valeur) => void; lecture?: boolean }

export function Odontogramme({ value, onChange, lecture }: Props) {
  const [sel, setSel] = useState<string | null>(null);
  const couleur = (c: CodeDent) => CODES.find((x) => x.c === c)?.couleur ?? "#ccc";

  const bascule = (c: CodeDent) => {
    if (!sel || lecture) return;
    const cur = value[sel] ?? [];
    const next = cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c];
    const copie = { ...value };
    if (next.length) copie[sel] = next; else delete copie[sel];
    onChange(copie);
  };

  const dent = (n: number) => {
    const k = String(n);
    const cs = value[k] ?? [];
    return (
      <button key={k} type="button" onClick={() => setSel(k)} aria-pressed={sel === k}
        aria-label={`Dent ${k}${cs.length ? " : " + cs.join(", ") : ""}`}
        className={cn("flex w-9 flex-col items-center rounded-lg border border-transparent px-0.5 pb-1 pt-1 transition-colors hover:bg-canvas", sel === k && "border-brand bg-brand-soft")}>
        <span className="num text-[10px] font-medium text-mute">{k}</span>
        <svg viewBox="3 2 18 20" className="h-6 w-6" aria-hidden="true">
          <path d={TOOTH} fill={cs.length ? couleur(cs[0]) : "#FFFFFF"} fillOpacity={cs.length ? 0.55 : 1} stroke="#8A94A6" strokeWidth="1" />
        </svg>
        <span className="mt-0.5 flex min-h-[14px] flex-wrap justify-center gap-px">
          {cs.map((c) => <i key={c} style={{ background: couleur(c) }} className="rounded px-[3px] text-[8px] font-bold not-italic leading-[12px] text-ink">{c}</i>)}
        </span>
      </button>
    );
  };

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div className="space-y-1.5">
          {RANGEES.map(([g, d], i) => (
            <div key={i} className="flex min-w-[640px] justify-center gap-0.5">
              {g.map(dent)}<span className="w-4" />{d.map(dent)}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-canvas p-4">
        {sel ? (
          <>
            <p className="mb-3 text-sm font-semibold">Dent {sel}{lecture ? "" : " : cochez un ou plusieurs codes"}</p>
            <div className="flex flex-wrap gap-2">
              {CODES.map((k) => {
                const on = (value[sel] ?? []).includes(k.c);
                return (
                  <button key={k.c} type="button" disabled={lecture} aria-pressed={on} onClick={() => bascule(k.c)}
                    style={on ? { background: k.couleur, borderColor: k.couleur } : undefined}
                    className={cn("h-11 rounded-xl border border-line bg-white px-3 text-[13px] font-medium transition-colors md:h-9", !on && "hover:bg-white/60", lecture && "opacity-60")}>
                    <b>{k.c}</b> {k.nom}
                  </button>
                );
              })}
            </div>
          </>
        ) : <p className="text-sm text-mute">Touchez une dent pour voir ou modifier ses codes.</p>}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {CODES.map((k) => (
          <li key={k.c} className="flex items-center gap-2 text-xs text-mute">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: k.couleur }} /><b className="text-ink">{k.c}</b> {k.nom}
          </li>
        ))}
      </ul>
    </div>
  );
}
