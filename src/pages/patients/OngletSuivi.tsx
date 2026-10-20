import { useState, type ReactNode } from "react";
import { db, collections } from "@/data/db";
import type { DossierMedical, SoinLigne } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { formatDateFr, formatFcfa } from "@/lib/utils";

interface Props {
  dossier: DossierMedical;
  onSaved: (d: DossierMedical) => void;
  praticienId: string;
  lectureSeule?: boolean;
}

const vide = (): SoinLigne => ({
  id: "",
  date: new Date().toISOString().slice(0, 10),
  dents: "",
  natureActes: "",
  montantActe: 0,
  montantPaye: 0,
  resteAPayer: 0,
  dateRdv: "",
  praticienId: "",
});

export function OngletSuivi({ dossier, onSaved, praticienId, lectureSeule }: Props) {
  const [edition, setEdition] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [form, setForm] = useState<DossierMedical>(dossier);
  const [ligne, setLigne] = useState<SoinLigne>(vide());

  const totalActes = form.soins.reduce((acc, s) => acc + (s.montantActe ?? 0), 0);
  const totalPaye = form.soins.reduce((acc, s) => acc + s.montantPaye, 0);
  const resteGlobal = Math.max(totalActes - totalPaye, 0);
  const lecture = lectureSeule || !edition;

  function ajouter() {
    if (!ligne.natureActes.trim()) return;
    const nouvelle: SoinLigne = {
      ...ligne,
      id: db.uid(),
      praticienId: praticienId,
      resteAPayer: Math.max(ligne.montantActe - ligne.montantPaye, 0),
    };
    setForm((f) => ({ ...f, soins: [...f.soins, nouvelle] }));
    setLigne(vide());
  }

  function supprimer(id: string) {
    setForm((f) => ({ ...f, soins: f.soins.filter((s) => s.id !== id) }));
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
    setLigne(vide());
    setEdition(false);
  }

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

      <Card title="Résumé financier" accent="accent">
        <div className="grid gap-4 sm:grid-cols-3">
          <Montant label="Total des actes" valeur={totalActes} />
          <Montant label="Total payé" valeur={totalPaye} />
          <Montant label="Reste à payer" valeur={resteGlobal} danger={resteGlobal > 0} />
        </div>
      </Card>

      {edition && (
        <Card title="Ajouter une ligne de soin" accent="accent">
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Date du jour"
              type="date"
              value={ligne.date}
              onChange={(e) => setLigne({ ...ligne, date: e.target.value })}
              disabled={lecture}
            />
            <Input
              label="Dent(s) soignée(s)"
              value={ligne.dents}
              onChange={(e) => setLigne({ ...ligne, dents: e.target.value })}
              placeholder="Ex : 36, 37"
              disabled={lecture}
            />
            <Input
              label="Nature des actes"
              value={ligne.natureActes}
              onChange={(e) => setLigne({ ...ligne, natureActes: e.target.value })}
              placeholder="Ex : Obturation composite"
              disabled={lecture}
            />
            <Input
              label="Montant de l'acte (FCFA)"
              type="number"
              value={ligne.montantActe || ""}
              onChange={(e) => setLigne({ ...ligne, montantActe: Number(e.target.value) || 0 })}
              disabled={lecture}
            />
            <Input
              label="Montant payé (FCFA)"
              type="number"
              value={ligne.montantPaye || ""}
              onChange={(e) => setLigne({ ...ligne, montantPaye: Number(e.target.value) || 0 })}
              disabled={lecture}
            />
            <Input
              label="Date du RDV"
              type="date"
              value={ligne.dateRdv}
              onChange={(e) => setLigne({ ...ligne, dateRdv: e.target.value })}
              disabled={lecture}
            />
          </div>
          <div className="mt-4">
            <Button size="sm" onClick={ajouter} disabled={lecture}>
              Ajouter la ligne
            </Button>
          </div>
        </Card>
      )}

      <Card title="Suivi des soins" accent="accent">
        {form.soins.length === 0 ? (
          <p className="text-sm text-faint">Aucun soin enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-line">
                  <Th>Date</Th>
                  <Th>Dent(s)</Th>
                  <Th>Actes</Th>
                  <Th>Acte</Th>
                  <Th>Payé</Th>
                  <Th>Reste</Th>
                  <Th>RDV</Th>
                  {edition && <Th> </Th>}
                </tr>
              </thead>
              <tbody>
                {form.soins.map((s) => (
                  <tr key={s.id} className="border-b border-line last:border-b-0">
                    <Td>{formatDateFr(s.date)}</Td>
                    <Td>{s.dents || "—"}</Td>
                    <Td>{s.natureActes}</Td>
                    <Td>{formatFcfa(s.montantActe ?? 0)}</Td>
                    <Td>{formatFcfa(s.montantPaye)}</Td>
                    <Td>{formatFcfa(Math.max((s.montantActe ?? 0) - s.montantPaye, 0))}</Td>
                    <Td>{s.dateRdv ? formatDateFr(s.dateRdv) : "—"}</Td>
                    {edition && (
                      <Td>
                        <button
                          type="button"
                          onClick={() => supprimer(s.id)}
                          className="text-xs text-danger hover:underline"
                        >
                          Supprimer
                        </button>
                      </Td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Montant({ label, valeur, danger }: { label: string; valeur: number; danger?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${danger ? "text-danger" : "text-ink"}`}>
        {formatFcfa(valeur)}
      </p>
    </div>
  );
}

function Th({ children }: { children?: ReactNode }) {
  return (
    <th className="py-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
      {children}
    </th>
  );
}

function Td({ children }: { children: ReactNode }) {
  return <td className="py-2.5 px-2 text-ink">{children}</td>;
}