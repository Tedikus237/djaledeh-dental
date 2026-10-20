import { cn } from "@/lib/utils";

const fmt = (v: number) => (v >= 1e6 ? `${+(v / 1e6).toFixed(1)} M` : v >= 1e3 ? `${Math.round(v / 1e3)} k` : String(Math.round(v)));
const nice = (m: number) => { if (m <= 0) return 1; const p = 10 ** Math.floor(Math.log10(m)); const r = m / p; return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10) * p; };
const W = 640, H = 220, L = 48, R = 12, T = 12, B = 28, IW = W - L - R, IH = H - T - B;

function Grille({ max, y }: { max: number; y: (v: number) => number }) {
  return <>{[0, 1, 2, 3, 4].map((i) => { const v = (max * i) / 4; return (
    <g key={i}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#E6EAF0" /><text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="10" fill="#8A94A6">{fmt(v)}</text></g>
  ); })}</>;
}

export function AreaChart({ data }: { data: { label: string; value: number }[] }) {
  const max = nice(Math.max(...data.map((d) => d.value), 0));
  const x = (i: number) => L + (data.length < 2 ? IW / 2 : (i * IW) / (data.length - 1));
  const y = (v: number) => T + IH - (v / max) * IH;
  const ligne = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.value)}`).join(" ");
  const step = Math.ceil(data.length / 7);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Entrées d'argent">
      <Grille max={max} y={y} />
      {data.length > 0 && <path d={`${ligne} L${x(data.length - 1)},${T + IH} L${x(0)},${T + IH} Z`} fill="#0EA5E9" fillOpacity=".10" />}
      <path d={ligne} fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinejoin="round" />
      {data.map((d, i) => i % step === 0 && <text key={"l" + i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#8A94A6">{d.label}</text>)}
      {data.map((d, i) => <circle key={i} cx={x(i)} cy={y(d.value)} r="3" fill="#fff" stroke="#0EA5E9" strokeWidth="2"><title>{`${d.label} : ${Math.round(d.value)} FCFA`}</title></circle>)}
    </svg>
  );
}

export function GroupedBars({ data }: { data: { label: string; a: number; b: number }[] }) {
  const max = nice(Math.max(...data.flatMap((d) => [d.a, d.b]), 0));
  const y = (v: number) => T + IH - (v / max) * IH;
  const gw = IW / Math.max(data.length, 1), bw = Math.min(16, gw / 3);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Facturé et encaissé">
      <Grille max={max} y={y} />
      {data.map((d, i) => { const c = L + i * gw + gw / 2; return (
        <g key={i}>
          <rect x={c - bw - 1} y={y(d.a)} width={bw} height={T + IH - y(d.a)} rx="3" fill="#0B1220"><title>{`Facturé : ${Math.round(d.a)} FCFA`}</title></rect>
          <rect x={c + 1} y={y(d.b)} width={bw} height={T + IH - y(d.b)} rx="3" fill="#0EA5E9"><title>{`Encaissé : ${Math.round(d.b)} FCFA`}</title></rect>
          <text x={c} y={H - 8} textAnchor="middle" fontSize="10" fill="#8A94A6">{d.label}</text>
        </g>
      ); })}
    </svg>
  );
}

export function Donut({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0), r = 44, c = 2 * Math.PI * r;
  let off = 0;
  return (
    <div className="flex items-center gap-6">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#E6EAF0" strokeWidth="14" />
          {parts.map((p) => { const len = total ? (p.value / total) * c : 0; const el = <circle key={p.label} cx="60" cy="60" r={r} fill="none" stroke={p.color} strokeWidth="14" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-off} />; off += len; return el; })}
        </svg>
        <span className="num absolute inset-0 grid place-items-center text-xl font-bold">{total}</span>
      </div>
      <ul className="space-y-2">
        {parts.map((p) => <li key={p.label} className="flex items-center gap-2 text-sm"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} /><span className="text-mute">{p.label}</span><b className="num">{p.value}</b></li>)}
      </ul>
    </div>
  );
}

export function HBars({ rows, couleur = "bg-ink", format = (v: number) => fmt(v) + " FCFA", vide = "Rien à afficher." }: { rows: { label: string; value: number }[]; couleur?: string; format?: (v: number) => string; vide?: string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  if (!rows.length) return <p className="py-6 text-center text-sm text-faint">{vide}</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex justify-between text-sm"><span className="truncate font-medium">{r.label}</span><span className="num text-mute">{format(r.value)}</span></div>
          <div className="h-2 rounded-full bg-canvas"><div className={cn("h-2 rounded-full", couleur)} style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
