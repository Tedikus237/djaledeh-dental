import { useState } from "react";
import { db, collections } from "@/data/db";
import type { DossierMedical } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";

interface Props {
  dossier: DossierMedical;
  onSaved: (d: DossierMedical) => void;
  lectureSeule?: boolean;
}

export function OngletDiagnostic({ dossier, onSaved, lectureSeule }: Props) {
  const [edition, setEdition] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [form, setForm] = useState<DossierMedical>(dossier);

  const lecture = lectureSeule || !edition;

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

      <Card title="Diagnostic" accent="accent">
        <Textarea
          value={form.diagnostic.diagnostic}
          onChange={(e) =>
            setForm((f) => ({ ...f, diagnostic: { ...f.diagnostic, diagnostic: e.target.value } }))
          }
          disabled={lecture}
          placeholder="Diagnostic posé par le praticien"
        />
      </Card>

      <Card title="C.A.T. (Conduite à tenir)" accent="accent">
        <Textarea
          value={form.diagnostic.cat}
          onChange={(e) =>
            setForm((f) => ({ ...f, diagnostic: { ...f.diagnostic, cat: e.target.value } }))
          }
          disabled={lecture}
          placeholder="Traitement prévu, actes à réaliser"
        />
      </Card>
    </div>
  );
}