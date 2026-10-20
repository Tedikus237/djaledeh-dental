import { useNavigate, useSearchParams } from "react-router-dom";
import { useAcces } from "@/auth/useAcces";
import { IconPlus, IconSearch } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useDonnees } from "@/data/useDonnees";
import { isoDay } from "@/lib/dates";
import { formatDateFr, formatFcfa } from "@/lib/utils";

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function ListePatients() {
  const d = useDonnees();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const { docteurId, peutEditer } = useAcces();
  if (!d) return <PageSkeleton />;

  const q = params.get("q") ?? "";
  const today = isoDay();
  const visibles = d.patientsActifs.filter((p) => !docteurId || d.rdvs.some((r) => r.patientId === p.id && r.docteurId === docteurId));
  const rows = visibles.filter((p) => !q || norm(`${p.nom} ${p.prenom} ${p.telephone} ${p.numeroDossier}`).includes(norm(q)));
  const dernier = (id: string) => d.rdvs.filter((r) => r.patientId === id && r.dateRdv <= today).map((r) => r.dateRdv).sort().pop();
  const solde = (id: string) => d.factures.filter((f) => f.patientId === id).reduce((s, f) => s + f.montantTotal - f.montantPaye, 0);
  const cols = "md:grid-cols-[120px_1.4fr_1fr_1fr_130px]";

  return (
    <>
      <PageHeader eyebrow="Patients" title="Dossiers patients">
        {peutEditer && <Button variant="outline" onClick={() => nav("/patients/corbeille")}><span>Corbeille</span></Button>}
        {peutEditer && <Button onClick={() => nav("/patients/nouveau")}><IconPlus size={16} />Nouveau patient</Button>}
      </PageHeader>
      <div className="relative mb-4 max-w-md">
        <IconSearch size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
        <input type="search" value={q} onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {})}
          placeholder="Nom, téléphone ou numéro de dossier" aria-label="Rechercher un patient"
          className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm placeholder:text-faint focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" />
      </div>
      <Card className="animate-rise overflow-hidden">
        <div className={`hidden grid-cols-1 gap-4 border-b border-line px-5 py-3 text-xs font-medium text-mute md:grid ${cols}`}>
          <span>N° dossier</span><span>Patient</span><span>Téléphone</span><span>Dernier RDV</span><span className="text-right">Solde</span>
        </div>
        {rows.length ? (
          <ul className="divide-y divide-line">
            {rows.map((p) => {
              const s = solde(p.id); const dr = dernier(p.id);
              return (
                <li key={p.id}>
                  <button onClick={() => nav(`/patients/${p.id}`)} className={`grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-4 text-left transition-colors hover:bg-canvas md:grid-cols-1 ${cols} md:grid`}>
                    <span className="num hidden text-xs text-mute md:block">{p.numeroDossier}</span>
                    <span className="min-w-0"><span className="block truncate text-sm font-semibold">{p.prenom} {p.nom}</span><span className="num block text-xs text-mute md:hidden">{p.numeroDossier}</span></span>
                    <span className="num hidden text-sm text-mute md:block">{p.telephone}</span>
                    <span className="num hidden text-sm text-mute md:block">{dr ? formatDateFr(dr) : "—"}</span>
                    <span className={`num text-right text-sm font-semibold ${s > 0 ? "text-danger" : "text-mute"}`}>{s > 0 ? formatFcfa(s) : "Soldé"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : <p className="px-5 py-12 text-center text-sm text-faint">Aucun patient ne correspond à « {q} ».</p>}
      </Card>
    </>
  );
}
