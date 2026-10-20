import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { entreprises } from "@/data/services";
import type { Entreprise } from "@/types";

const CHAMPS: [keyof Pick<Entreprise, "bp" | "contribuable" | "rccm" | "telephone">, string][] = [["bp", "Boîte postale"], ["contribuable", "N° contribuable"], ["rccm", "RCCM"], ["telephone", "Téléphone"]];

export default function Entreprises() {
  const [rows, setRows] = useState<Entreprise[] | null>(null);
  const [nom, setNom] = useState("");
  const [pct, setPct] = useState("25");
  const [err, setErr] = useState("");
  const charger = async () => setRows(await entreprises.list());
  useEffect(() => { charger(); }, []);
  if (!rows) return <PageSkeleton />;

  const maj = async (e: Entreprise, patch: Partial<Entreprise>) => { await entreprises.update(e.id, patch); charger(); };
  async function ajouter() {
    const p = Number(pct);
    if (!nom.trim()) return setErr("Indiquez le nom.");
    if (!(p >= 0 && p <= 100)) return setErr("Le pourcentage doit être compris entre 0 et 100.");
    await entreprises.create({ nom: nom.trim(), bp: "", contribuable: "", rccm: "", telephone: "", partPatient: p, bonRequis: true });
    setNom(""); setErr(""); charger();
  }

  return (
    <>
      <PageHeader eyebrow="Paramètres" title="Entreprises et assurances" />
      <p className="mb-4 max-w-2xl text-sm text-mute">Le pourcentage est la part payée par le patient ; le reste est facturé à l'entreprise. Ces informations apparaissent sur la facture (bloc « DOIT »).</p>
      <Card className="mb-6 animate-rise p-5">
        <p className="eyebrow mb-4">Ajouter</p>
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_auto] md:items-end">
          <Input label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} />
          <Input label="Part du patient (%)" type="number" min={0} max={100} value={pct} onChange={(e) => setPct(e.target.value)} />
          <Button onClick={ajouter}>Ajouter</Button>
        </div>
        {err && <p role="alert" className="mt-3 text-sm text-danger">{err}</p>}
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((e) => (
          <Card key={e.id} className="animate-rise p-5">
            <h2 className="mb-4 text-[15px] font-semibold">{e.nom}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Part du patient (%)" type="number" min={0} max={100} defaultValue={e.partPatient} onBlur={(ev) => maj(e, { partPatient: Math.min(100, Math.max(0, Number(ev.target.value) || 0)) })} />
              <label className="flex h-11 items-center gap-2 self-end text-sm"><input type="checkbox" checked={e.bonRequis} onChange={(ev) => maj(e, { bonRequis: ev.target.checked })} className="h-5 w-5 accent-[#0B1220]" />Bon de prise en charge exigé</label>
              {CHAMPS.map(([k, l]) => <Input key={k} label={l} defaultValue={e[k]} onBlur={(ev) => maj(e, { [k]: ev.target.value } as Partial<Entreprise>)} />)}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
