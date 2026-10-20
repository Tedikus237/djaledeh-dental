import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { actes } from "@/data/services";
import { LETTRES, libelleCode, prixAssure } from "@/lib/tarifs";
import { formatFcfa } from "@/lib/utils";
import type { Acte, Lettre } from "@/types";

const cellule = "num h-10 w-full rounded-lg border border-line bg-white px-2.5 text-right text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15";

export default function Catalogue() {
  const [rows, setRows] = useState<Acte[] | null>(null);
  const [q, setQ] = useState("");
  const [nv, setNv] = useState({ libelle: "", lettre: "D" as Lettre, coefficient: "", prixNonAssure: "", dureeMinutes: "30" });
  const [err, setErr] = useState("");
  const charger = async () => setRows(await actes.list());
  useEffect(() => { charger(); }, []);
  if (!rows) return <PageSkeleton />;

  const maj = async (a: Acte, patch: Partial<Acte>) => { await actes.update(a.id, patch); charger(); };
  async function ajouter() {
    if (!nv.libelle.trim() || !(Number(nv.coefficient) > 0)) return setErr("Indiquez le libellé et un coefficient supérieur à 0.");
    await actes.create({ libelle: nv.libelle.trim(), lettre: nv.lettre, coefficient: Number(nv.coefficient), prixNonAssure: Number(nv.prixNonAssure) || 0, dureeMinutes: Number(nv.dureeMinutes) || 30, actif: true });
    setNv({ ...nv, libelle: "", coefficient: "", prixNonAssure: "" }); setErr(""); charger();
  }
  const liste = rows.filter((a) => a.libelle.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader eyebrow="Paramètres" title="Catalogue des actes" />
      <p className="mb-4 max-w-2xl text-sm text-mute">Seuls les actes cochés sont proposés à la secrétaire. Le prix « assuré » suit la nomenclature (coefficient × lettre). Le prix « non assuré » est fixé ici ; à 0, le prix assuré est utilisé.</p>

      <Card className="mb-6 animate-rise p-5">
        <p className="eyebrow mb-4">Ajouter un acte</p>
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] md:items-end">
          <Input label="Libellé" value={nv.libelle} onChange={(e) => setNv({ ...nv, libelle: e.target.value })} />
          <Select label="Lettre" value={nv.lettre} onChange={(e) => setNv({ ...nv, lettre: e.target.value as Lettre })}>{Object.entries(LETTRES).map(([k, v]) => <option key={k} value={k}>{k} · {v.label}</option>)}</Select>
          <Input label="Coefficient" type="number" min={0} value={nv.coefficient} onChange={(e) => setNv({ ...nv, coefficient: e.target.value })} />
          <Input label="Prix non assuré" type="number" min={0} value={nv.prixNonAssure} onChange={(e) => setNv({ ...nv, prixNonAssure: e.target.value })} />
          <Input label="Durée (min)" type="number" min={5} value={nv.dureeMinutes} onChange={(e) => setNv({ ...nv, dureeMinutes: e.target.value })} />
          <Button onClick={ajouter}>Ajouter</Button>
        </div>
        {err && <p role="alert" className="mt-3 text-sm text-danger">{err}</p>}
      </Card>

      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un acte" aria-label="Rechercher un acte" className="mb-4 h-11 w-full max-w-sm rounded-xl border border-line bg-white px-3.5 text-sm placeholder:text-faint focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" />
      <Card className="animate-rise overflow-hidden">
        <div className="hidden grid-cols-[1.6fr_80px_120px_140px_90px_60px] gap-4 border-b border-line px-5 py-3 text-xs font-medium text-mute md:grid"><span>Acte</span><span>Code</span><span className="text-right">Prix assuré</span><span className="text-right">Prix non assuré</span><span className="text-right">Durée</span><span>Actif</span></div>
        <ul className="divide-y divide-line">
          {liste.map((a) => (
            <li key={a.id} className="grid grid-cols-2 items-center gap-3 px-5 py-4 md:grid-cols-[1.6fr_80px_120px_140px_90px_60px] md:gap-4">
              <span className="col-span-2 text-sm font-medium md:col-span-1">{a.libelle}</span>
              <span className="num text-sm text-mute">{libelleCode(a)}</span>
              <span className="num text-right text-sm">{formatFcfa(prixAssure(a))}</span>
              <input aria-label={`Prix non assuré ${a.libelle}`} type="number" min={0} defaultValue={a.prixNonAssure} onBlur={(e) => maj(a, { prixNonAssure: Number(e.target.value) || 0 })} className={cellule} />
              <input aria-label={`Durée ${a.libelle}`} type="number" min={5} defaultValue={a.dureeMinutes} onBlur={(e) => maj(a, { dureeMinutes: Number(e.target.value) || 30 })} className={cellule} />
              <input aria-label={`Actif ${a.libelle}`} type="checkbox" checked={a.actif} onChange={(e) => maj(a, { actif: e.target.checked })} className="h-5 w-5 accent-[#0B1220]" />
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
