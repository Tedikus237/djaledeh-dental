import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { CodeDent, DossierMedical, Patient, Soin, SoinLigne } from "@/types";
import { CABINET } from "./cabinet";
import { formatDateFr } from "./utils";

const MARGE = 15;
const LARGEUR = 210;
const HAUTEUR = 297;
const DENTS: number[][] = [
  [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
  [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
  [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
];
const CODES: { code: CodeDent; label: string; color: string }[] = [
  { code: "C", label: "Carie", color: "#FCD34D" },
  { code: "A", label: "Absente", color: "#9CA3AF" },
  { code: "O", label: "Obturée", color: "#60A5FA" },
  { code: "DR", label: "Débris radiculaire", color: "#F87171" },
  { code: "DC", label: "Délabrement coronaire", color: "#FB923C" },
  { code: "M", label: "Mylolyse", color: "#A78BFA" },
  { code: "PP", label: "Poche parodontale", color: "#34D399" },
];
const TOOTH = "M12 3c-1.7 0-2.8 1-4 1-1.9 0-3.5 1.6-3.5 4 0 1.6.4 2.7.8 4.2.4 1.5.7 3.3 1.1 5.1.3 1.4.8 2.7 1.9 2.7.9 0 1-2.1 1.2-3.4.2-1.1.6-2 1.5-2s1.3.9 1.5 2c.2 1.3.3 3.4 1.2 3.4 1.1 0 1.6-1.3 1.9-2.7.4-1.8.7-3.6 1.1-5.1.4-1.5.8-2.6.8-4.2 0-2.4-1.6-4-3.5-4-1.2 0-2.3-1-4-1Z";

type PartageResultat = "partage" | "telechargement" | "annule";
type PdfAvecTable = jsPDF & { lastAutoTable?: { finalY: number } };

async function chargerLogo(): Promise<{ data: string; width: number; height: number }> {
  const response = await fetch("/logo.png");
  if (!response.ok) throw new Error("Impossible de charger le logo du cabinet pour le PDF.");
  const blob = await response.blob();
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Le logo du cabinet n’a pas pu être lu."));
    reader.onerror = () => reject(new Error("Le logo du cabinet n’a pas pu être lu."));
    reader.readAsDataURL(blob);
  });
  const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.width, height: image.height });
    image.onerror = () => reject(new Error("Le fichier du logo du cabinet est illisible."));
    image.src = data;
  });
  return { data, ...dimensions };
}

function codesDentValides(value: unknown): value is CodeDent {
  return CODES.some((item) => item.code === value);
}

function normaliserOdontogramme(value: unknown): Record<string, CodeDent[]> {
  if (Array.isArray(value)) {
    const result: Record<string, CodeDent[]> = {};
    for (const tooth of value) {
      if (typeof tooth !== "object" || tooth === null || !("numero" in tooth) || !("codes" in tooth)) continue;
      const { numero, codes } = tooth;
      if ((typeof numero === "string" || typeof numero === "number") && Array.isArray(codes)) {
        result[String(numero)] = codes.filter(codesDentValides);
      }
    }
    return result;
  }
  if (typeof value !== "object" || value === null) return {};
  return Object.fromEntries(
    Object.entries(value).map(([number, codes]) => [number, Array.isArray(codes) ? codes.filter(codesDentValides) : []])
  );
}

function texte(value: string | number | undefined | null) {
  return value === undefined || value === null || value === "" ? "Non renseigné" : String(value);
}

function ajouterTable(doc: PdfAvecTable, titre: string, rows: [string, string][]) {
  let y = (doc.lastAutoTable?.finalY ?? 57) + 10;
  if (y > 265) {
    doc.addPage();
    y = MARGE;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(titre, MARGE, y);
  autoTable(doc, {
    startY: y + 3,
    margin: { left: MARGE, right: MARGE },
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2.5, overflow: "linebreak" },
    columnStyles: { 0: { cellWidth: 48, fontStyle: "bold" }, 1: { cellWidth: 132 } },
    body: rows,
  });
}

async function odontogrammePng(value: unknown): Promise<string> {
  const odontogramme = normaliserOdontogramme(value);
  const width = 760;
  const height = 245;
  const rowY = [32, 74, 128, 170];
  const svgRows = DENTS.map((row, i) => {
    const gap = 42;
    const total = (row.length - 1) * gap;
    const start = (width - total) / 2;
    return row.map((number, j) => {
      const x = start + j * gap;
      const codes = odontogramme[String(number)] ?? [];
      const color = CODES.find((item) => item.code === codes[0])?.color ?? "#FFFFFF";
      const labels = codes.map((code, index) =>
        `<text x="${x + 8 + index * 10}" y="${rowY[i] + 35}" text-anchor="middle" font-size="7" font-weight="bold" fill="#111827">${code}</text>`
      ).join("");
      return `<g><text x="${x + 8}" y="${rowY[i] - 5}" text-anchor="middle" font-size="10" fill="#374151">${number}</text><path d="${TOOTH}" transform="translate(${x},${rowY[i]}) scale(0.7)" fill="${color}" stroke="#64748B" stroke-width="1.5"/>${labels}</g>`;
    }).join("");
  }).join("");
  const legend = CODES.map((item, index) => {
    const x = MARGE + (index % 4) * 90;
    const y = 220 + Math.floor(index / 4) * 15;
    return `<rect x="${x}" y="${y - 8}" width="8" height="8" fill="${item.color}"/><text x="${x + 12}" y="${y}" font-size="9" fill="#374151">${item.code} : ${item.label}</text>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="white"/>${svgRows}${legend}</svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Impossible de préparer l’odontogramme pour le PDF.");
    context.scale(2, 2);
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function soinRows(soins: Soin[], legacy: SoinLigne[]) {
  const rows: string[][] = soins.map((soin) => [
    formatDateFr(soin.dateSoin),
    `Dent(s) ${texte(soin.dents)} — ${texte(soin.natureActes)}`,
    texte(soin.praticien),
    soin.dateProchainRdv ? formatDateFr(soin.dateProchainRdv) : "—",
  ]);
  rows.push(...legacy.map((soin) => [
    formatDateFr(soin.date),
    `Dent(s) ${texte(soin.dents)} — ${texte(soin.natureActes)}`,
    texte(soin.praticienId),
    soin.dateRdv ? formatDateFr(soin.dateRdv) : "—",
  ]));
  const uniqueRows = rows.filter((row, index) =>
    rows.findIndex((candidate) => candidate.join("|") === row.join("|")) === index
  );
  return uniqueRows.length ? uniqueRows : [["—", "Aucun soin enregistré", "—", "—"]];
}

async function creerPdf(patient: Patient, dossier: DossierMedical, soins: Soin[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4" }) as PdfAvecTable;
  doc.setProperties({ title: `Dossier médical - ${patient.prenom} ${patient.nom}`, subject: "Dossier médical remis au patient" });
  const logo = await chargerLogo();
  const logoWidth = 48;
  const logoHeight = logoWidth * logo.height / logo.width;
  doc.addImage(logo.data, "PNG", MARGE, 10, logoWidth, logoHeight);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(CABINET.nom, 70, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(CABINET.adresse, 70, 24);
  doc.text(`Tél. : ${CABINET.telephones}`, 70, 29);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("DOSSIER MÉDICAL DU PATIENT", MARGE, 56);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Document établi le ${new Date().toLocaleDateString("fr-FR")}`, LARGEUR - MARGE, 56, { align: "right" });

  ajouterTable(doc, "Identification", [
    ["Nom et prénom", `${patient.prenom} ${patient.nom}`],
    ["N° de dossier", texte(patient.numeroDossier)],
    ["Date et lieu de naissance", `${texte(patient.dateNaissance)}${patient.lieuNaissance ? ` — ${patient.lieuNaissance}` : ""}`],
    ["Âge", `${patient.age} ans`],
    ["Téléphone", texte(patient.telephone)],
    ["Résidence", texte(patient.residence)],
    ["Profession", texte(patient.profession)],
    ["Situation matrimoniale", texte(patient.situationMatrimoniale)],
    ["Assurance", patient.assuranceNom || patient.nomAssurance || patient.assurance || "Aucune"],
    ["Personne à prévenir", texte(patient.personneUrgence || patient.personneAPrevenir)],
  ]);

  ajouterTable(doc, "Consultation et antécédents", [
    ["Date de consultation", formatDateFr(dossier.dateConsultation)],
    ["Motif", texte(dossier.motif || patient.motifConsultation)],
    ["Histoire de la maladie", texte(dossier.histoireMaladie || patient.histoireMaladie)],
    ["Antécédents", texte(dossier.antecedents || patient.antecedents)],
  ]);

  const examens = [
    ...Object.entries(dossier.exobuccal ?? {}).map(([label, value]) => [`Exobuccal — ${label}`, value] as [string, string]),
    ...Object.entries(dossier.endobuccal ?? {}).map(([label, value]) => [`Endobuccal — ${label}`, value] as [string, string]),
    ...Object.entries(dossier.examen ?? {}).map(([label, value]) => [`Examen — ${label}`, value] as [string, string]),
    ["Examen du M/C", dossier.examenMc],
    ["Examens complémentaires", dossier.examensComplementaires],
    ["Commentaire des examens", dossier.commentaireExamens],
  ];
  ajouterTable(doc, "Examens cliniques", examens.map(([label, value]) => [label, texte(value)]));
  ajouterTable(doc, "Diagnostic et conduite à tenir", [
    ["Diagnostic", texte(dossier.diagnostic)],
    ["Conduite à tenir", texte(dossier.cat)],
  ]);

  let y = (doc.lastAutoTable?.finalY ?? 45) + 10;
  if (y + 72 > HAUTEUR - MARGE) {
    doc.addPage();
    y = MARGE;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Odontogramme", MARGE, y);
  const chart = await odontogrammePng(dossier.odontogramme);
  doc.addImage(chart, "PNG", MARGE, y + 3, LARGEUR - 2 * MARGE, 62);

  const rows = soinRows(soins, dossier.soins ?? []).map((row) => row.map(texte));
  autoTable(doc, {
    startY: y + 69,
    margin: { left: MARGE, right: MARGE },
    theme: "grid",
    styles: { font: "helvetica", fontSize: 8, cellPadding: 2.3, overflow: "linebreak" },
    head: [["Date", "Soins effectués", "Praticien", "Prochain RDV"]],
    body: rows,
  });

  for (let page = 1; page <= doc.getNumberOfPages(); page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Document médical confidentiel — à remettre au patient concerné", MARGE, HAUTEUR - 8);
    doc.text(`${page}/${doc.getNumberOfPages()}`, LARGEUR - MARGE, HAUTEUR - 8, { align: "right" });
  }
  return doc;
}

export async function partagerDossierPdf(patient: Patient, dossier: DossierMedical, soins: Soin[]): Promise<PartageResultat> {
  const doc = await creerPdf(patient, dossier, soins);
  const nom = `${patient.prenom}_${patient.nom}`.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `Dossier_medical_${nom}.pdf`;
  const file = new File([doc.output("blob")], filename, { type: "application/pdf" });

  if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `Dossier médical — ${patient.prenom} ${patient.nom}` });
      return "partage";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "annule";
      throw new Error("Le partage du PDF a échoué. Vous pouvez réessayer ou télécharger le document.", { cause: error });
    }
  }

  doc.save(filename);
  return "telechargement";
}
