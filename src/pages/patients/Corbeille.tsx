import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconArrowLeft, IconRefresh } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useDonnees } from "@/data/useDonnees";
import { patients } from "@/data/services";
import { formatDateFr } from "@/lib/utils";

export default function CorbeillePatients() {
  const d = useDonnees();
  const nav = useNavigate();
  const [restauration, setRestauration] = useState<string | null>(null);
  const [erreur, setErreur] = useState("");
  if (!d) return <PageSkeleton />;

  const supprimes = d.patients.filter((p) => p.deletedAt);

  async function restaurer(id: string) {
    setRestauration(id);
    setErreur("");
    try {
      await patients.update(id, { deletedAt: undefined });
      nav("/patients", { replace: true });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Impossible de restaurer ce patient.");
    } finally {
      setRestauration(null);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Patients" title="Corbeille">
        <Button variant="outline" onClick={() => nav("/patients")}><IconArrowLeft size={16} />Retour aux patients</Button>
      </PageHeader>
      {erreur && <p role="alert" className="mb-4 text-sm text-danger">{erreur}</p>}
      <Card className="animate-rise overflow-hidden">
        {supprimes.length ? (
          <ul className="divide-y divide-line">
            {supprimes.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold">{p.prenom} {p.nom}</p>
                  <p className="mt-1 text-xs text-mute">{p.numeroDossier} · Déplacé le {formatDateFr(p.deletedAt ?? "")}</p>
                </div>
                <Button variant="outline" loading={restauration === p.id} onClick={() => restaurer(p.id)}>
                  <IconRefresh size={16} />Restaurer
                </Button>
              </li>
            ))}
          </ul>
        ) : <p className="px-5 py-12 text-center text-sm text-faint">La corbeille est vide.</p>}
      </Card>
      <p className="mt-3 text-xs text-mute">Les données médicales, rendez-vous et factures des patients dans la corbeille sont conservés.</p>
    </>
  );
}
