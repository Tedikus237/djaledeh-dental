import { useState } from "react";
import { cn } from "@/lib/utils";
import { db, collections } from "@/data/db";
import type { CodeDent, DossierMedical, DentState } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";

const CODES: { code: CodeDent; label: string; couleur: string }[] = [
  { code: "C", label: "Carie", couleur: "#FCD34D" },
  { code: "A", label: "Absente", couleur: "#9CA3AF" },
  { code: "O", label: "Obturée", couleur: "#60A5FA" },
  { code: "DR", label: "Débris Radiculaire", couleur: "#F87171" },
  { code: "DC", label: "Délabrement Coronaire", couleur: "#FB923C" },
  { code: "M", label: "Mylolyse", couleur: "#A78BFA" },
  { code: "PP", label: "Poche Parodontale", couleur: "#34D399" },
];

const LIGNES: number[][] = [
  [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
  [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
  [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
];

function couleurPourCodes(codes: CodeDent[]): string {
  if (codes.length === 0) return "transparent";
  const dernier = codes[codes.length - 1];
  return CODES.find((c) => c.code === dernier)?.couleur ?? "transparent";
}

interface Props {
  dossier: DossierMedical;
  onSaved: (d: DossierMedical) => void;
  lectureSeule?: boolean;
}

export function OngletExamen({ dossier, onSaved, lectureSeule }: Props) {
  const [edition, setEdition] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [form, setForm] = useState<DossierMedical>(dossier);

  function setExamen<K extends keyof DossierMedical["examen"]>(
    key: K,
    value: DossierMedical["examen"][K]
  ) {
    setForm((f) => ({ ...f, examen: { ...f.examen, [key]: value } }));
  }

  async function enregistrer() {
    setEnregistrement(true);
    const updated = await db.update<DossierMedical & { id: string }>(
      collections.dossiers,
      dossier.patientId,
      form
    );
    setEnregistrement(false);
    if (updated) {
      onSaved(updated);
      setEdition(false);
    }
  }

  function annuler() {
    setForm(dossier);
    setEdition(false);
  }

  const lecture = lectureSeule || !edition;

  return (
    <div className="space-y-6">
      {!lectureSeule && (
        <div className="flex justify-end gap-2">
          {edition ? (
            <>
              <Button variant="outline" size="sm" onClick={annuler}>
                Annuler
              </Button>
              <Button size="sm" onClick={enregistrer} disabled={enregistrement}>
                {enregistrement ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEdition(true)}>
              Modifier
            </Button>
          )}
        </div>
      )}

      <Card title="Examen exobuccal" accent="accent">
        <div className="grid gap-5 md:grid-cols-2">
          <Champ label="Ouverture buccale" value={form.examen.ouvertureBuccale} onChange={(v) => setExamen("ouvertureBuccale", v)} lecture={lecture} />
          <Champ label="ATM" value={form.examen.atm} onChange={(v) => setExamen("atm", v)} lecture={lecture} />
          <Champ label="Adénopathie" value={form.examen.adenopathie} onChange={(v) => setExamen("adenopathie", v)} lecture={lecture} />
          <Champ label="Autres" value={form.examen.autresExobuccal} onChange={(v) => setExamen("autresExobuccal", v)} lecture={lecture} />
        </div>
      </Card>

      <Card title="Examen endobuccal" accent="accent">
        <div className="grid gap-5 md:grid-cols-2">
          <Champ label="Tartre" value={form.examen.tartre} onChange={(v) => setExamen("tartre", v)} lecture={lecture} />
          <Champ label="Halitose" value={form.examen.halitose} onChange={(v) => setExamen("halitose", v)} lecture={lecture} />
          <Champ label="Gencive" value={form.examen.gencive} onChange={(v) => setExamen("gencive", v)} lecture={lecture} />
          <Champ label="Muqueuse" value={form.examen.muqueuse} onChange={(v) => setExamen("muqueuse", v)} lecture={lecture} />
          <Champ label="Diastème" value={form.examen.diasteme} onChange={(v) => setExamen("diasteme", v)} lecture={lecture} />
          <Champ label="DDM" value={form.examen.ddm} onChange={(v) => setExamen("ddm", v)} lecture={lecture} />
        </div>
      </Card>

      <Card title="Odontogramme" accent="accent">
        <OdontogrammeGrille
          valeur={form.odontogramme}
          onChange={(v) => setForm((f) => ({ ...f, odontogramme: v }))}
          lectureSeule={lecture}
        />
      </Card>

      <Card title="Examen du M/C" accent="accent">
        <Textarea value={form.examen.examenMC} onChange={(e) => setExamen("examenMC", e.target.value)} disabled={lecture} />
      </Card>

      <Card title="Examens complémentaires" accent="accent">
        <Textarea value={form.examen.examensComplementaires} onChange={(e) => setExamen("examensComplementaires", e.target.value)} disabled={lecture} />
      </Card>

      <Card title="Commentaire" accent="accent">
        <Textarea value={form.examen.commentaire} onChange={(e) => setExamen("commentaire", e.target.value)} disabled={lecture} />
      </Card>
    </div>
  );
}

function Champ({
  label,
  value,
  onChange,
  lecture,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  lecture: boolean;
}) {
  if (lecture) {
    return (
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">{label}</p>
        <p className="mt-1 text-sm text-ink">{value || "—"}</p>
      </div>
    );
  }
  return <Input label={label} value={value} onChange={(e) => onChange(e.target.value)} />;
}

function OdontogrammeGrille({
  valeur,
  onChange,
  lectureSeule,
}: {
  valeur: DentState[];
  onChange: (v: DentState[]) => void;
  lectureSeule?: boolean;
}) {
  const [ouverte, setOuverte] = useState<number | null>(null);

  function codesDe(numero: number): CodeDent[] {
    return valeur.find((d) => d.numero === numero)?.codes ?? [];
  }

  function toggle(numero: number, code: CodeDent) {
    if (lectureSeule) return;
    const actuel = codesDe(numero);
    const aCeCode = actuel.includes(code);
    const nouveauxCodes = aCeCode ? actuel.filter((c) => c !== code) : [...actuel, code];
    const autres = valeur.filter((d) => d.numero !== numero);
    const maj = nouveauxCodes.length ? [...autres, { numero, codes: nouveauxCodes }] : autres;
    maj.sort((a, b) => Number(a.numero) - Number(b.numero));
    onChange(maj);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        {CODES.map((c) => (
          <span key={c.code} className="inline-flex items-center gap-1.5 text-[11px] text-mute">
            <span className="h-2.5 w-2.5 rounded-sm border border-line" style={{ backgroundColor: c.couleur }} />
            <span className="font-semibold text-ink">{c.code}</span>
            <span className="text-faint">{c.label}</span>
          </span>
        ))}
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <div className="space-y-2 min-w-max">
          {LIGNES.map((ligne, i) => (
            <div key={i} className="flex gap-1.5">
              {ligne.map((num) => {
                const codes = codesDe(num);
                const couleur = couleurPourCodes(codes);
                const ouverteIci = ouverte === num;
                return (
                  <div key={num} className="relative">
                    <button
                      type="button"
                      disabled={lectureSeule}
                      onClick={() => setOuverte(ouverteIci ? null : num)}
                      className={cn(
                        "h-11 w-11 rounded-md border border-line bg-panel text-xs font-semibold text-ink",
                        "flex items-center justify-center transition-colors",
                        !lectureSeule && "hover:border-accent/50",
                        ouverteIci && "border-accent ring-2 ring-accent/20",
                        lectureSeule && "cursor-default"
                      )}
                      style={couleur !== "transparent" ? { backgroundColor: couleur, borderColor: couleur } : undefined}
                    >
                      {num}
                    </button>

                    {ouverteIci && (
                      <div className="absolute z-40 top-full left-1/2 -translate-x-1/2 mt-2 bg-panel border border-line rounded-lg shadow-xl p-1 min-w-[160px]">
                        {CODES.map((c) => {
                          const actif = codes.includes(c.code);
                          return (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => toggle(num, c.code)}
                              className={cn(
                                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[12px] transition-colors",
                                actif ? "bg-accent/15 text-ink" : "text-mute hover:bg-panelHover hover:text-ink"
                              )}
                            >
                              <span className="h-2.5 w-2.5 rounded-sm border border-line" style={{ backgroundColor: c.couleur }} />
                              <span className="font-semibold">{c.code}</span>
                              <span className="text-faint truncate">{c.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}