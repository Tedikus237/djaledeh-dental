import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Entreprise, Facture, Patient } from "@/types";
import { CABINET } from "./cabinet";
import { enLettres } from "./enLettres";
import { formatDateFr } from "./utils";

const nombre = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

async function chargerLogo(): Promise<{ url: string; w: number; h: number } | null> {
  try {
    const r = await fetch("/logo.png");
    if (!r.ok || !(r.headers.get("content-type") ?? "").startsWith("image")) return null;
    const blob = await r.blob();
    const url: string = await new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(fr.result as string); fr.readAsDataURL(blob); });
    const dim: { w: number; h: number } = await new Promise((ok) => { const im = new Image(); im.onload = () => ok({ w: im.width, h: im.height }); im.onerror = () => ok({ w: 1, h: 1 }); im.src = url; });
    return { url, ...dim };
  } catch { return null; }
}

export async function telechargerFacture(f: Facture, p: Patient, e: Entreprise | null) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 15;
  const logo = await chargerLogo();
  if (logo) {
    try { doc.addImage(logo.url, "PNG", M, 12, 62, Math.min((62 * logo.h) / logo.w, 44)); } catch { /* logo illisible : on continue */ }
  } else {
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.text(CABINET.nom, M, 20);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.text(CABINET.adresse, M, 26);
  }
  doc.setFont("helvetica", "bold"); doc.setFontSize(10);
  doc.text(`Garoua, le ${formatDateFr(f.dateEmission)}`, W - M, 22, { align: "right" });

  let y = 66;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold"); doc.text(`FACTURE : N°${f.numero}`, M, y);
  doc.setFont("helvetica", "normal");
  let yl = y + 6;
  if (f.bonPriseEnCharge) { doc.text("Suivant votre bon de prise en charge", M, yl); yl += 5; doc.text(`N° ${f.bonPriseEnCharge}`, M, yl); yl += 6; }
  doc.text("Pour consultation et soins dentaires de", M, yl); yl += 5;
  doc.setFont("helvetica", "bold"); doc.text(`${p.prenom} ${p.nom.toUpperCase()}`, M, yl);

  if (e) {
    doc.setFont("helvetica", "bold"); doc.text(`DOIT : ${e.nom}`, W - M, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    let yr = y + 6;
    for (const l of [e.bp, e.contribuable && `Contribuable : ${e.contribuable}`, e.rccm && `RCCM : ${e.rccm}`, e.telephone && `Tél : ${e.telephone}`]) {
      if (l) { doc.text(l, W - M, yr, { align: "right" }); yr += 5; }
    }
  }

  y = Math.max(yl, y + 30) + 12;
  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text("DÉTAIL DES ACTES (FCFA)", W / 2, y, { align: "center" });
  autoTable(doc, {
    startY: y + 5, theme: "plain", margin: { left: M, right: M },
    styles: { fontSize: 10, cellPadding: 2.2 },
    columnStyles: { 0: { cellWidth: 95 }, 1: { cellWidth: 40 }, 2: { halign: "right" } },
    body: f.lignes.map((l) => [l.libelle + (l.qte > 1 ? ` × ${l.qte}` : ""), l.code, nombre(l.montant)])
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  const assure = !!e;
  const ligne = (t: string, v: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(bold ? 12 : 10.5);
    doc.text(t, M + 10, y); doc.text(v, W - M, y, { align: "right" }); y += 8;
  };
  ligne("MONTANT TOTAL", nombre(f.montantTotal), true);
  if (assure) { ligne(`${f.partPatientPct} % (part du patient)`, nombre(f.partPatient)); ligne("NET À PAYER", nombre(f.netEntreprise), true); }
  y += 2;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  const arrete = doc.splitTextToSize(`Arrêté la présente facture à la somme de : ${enLettres(assure ? f.netEntreprise : f.montantTotal)} FCFA`, W - 2 * M);
  doc.text(arrete, M, y);

  doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.text(["INDICE : D = Soins dentaires, valeur 1 200 FCFA", "C = Consultation, valeur 10 000 FCFA"], W - M, 262, { align: "right" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
  doc.text(`${CABINET.nom} — ${CABINET.adresse} — Tél : ${CABINET.telephones}`, W / 2, 284, { align: "center" });
  doc.text(`${CABINET.agrement} — RCCM : ${CABINET.rccm} — NIU : ${CABINET.niu}`, W / 2, 288, { align: "center" });

  doc.save(`Facture_${f.numero.replace("/", "-")}.pdf`);
}
