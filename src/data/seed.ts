import { addDays, isoDay } from "@/lib/dates";
import { prixActe, libelleCode, repartition, statutDe } from "@/lib/tarifs";
import { calculerAge } from "@/lib/utils";
import type { Acte, Facture, Lettre, LigneSoin, NatureConsultation, Paiement, RappelWhatsapp, RendezVous, Soin, StatutRdv } from "@/types";
import { uid } from "./db";
import { actes, comptes, dossiers, entreprises, factures, patients, rappels, rdvs, soins } from "./services";

const DAY_KEY = "djaledeh:seedDay";
const DATA_KEY = "djaledeh:dataV";

// [libellé, lettre, coefficient, durée en minutes] : extraits de la nomenclature de l'ONCDC.
const ACTES: [string, Lettre, number, number][] = [
  ["Consultation", "C", 1, 20], ["Détartrage", "D", 16, 30], ["Radiographie rétro-alvéolaire", "Z", 6, 10], ["Radiographie panoramique", "Z", 20, 15],
  ["Obturation 1 face", "SC", 10, 30], ["Obturation 2 faces", "SC", 15, 40], ["Obturation 3 faces", "SC", 20, 45],
  ["Traitement canalaire incisive ou canine", "D", 15, 45], ["Traitement canalaire prémolaire", "D", 20, 60], ["Traitement canalaire molaire", "D", 35, 75],
  ["Extraction dentaire", "DC", 16, 30], ["Extraction dent lactéale", "DC", 10, 20], ["Dent de sagesse retenue", "DC", 50, 60],
  ["Bilan parodontal", "D", 20, 30], ["Surfaçage radiculaire (sextant)", "D", 40, 45], ["Gingivectomie 1 à 3 dents", "D", 25, 30],
  ["Pulpotomie dent lactéale", "D", 12, 30], ["Frénectomie", "DC", 30, 30], ["Suture de plaie intra-buccale", "DC", 8, 15],
  ["Évacuation d'abcès parodontal", "DC", 25, 20], ["Couronne provisoire", "F", 50000, 40], ["Couronne métallique", "F", 225000, 60],
  ["Couronne céramique", "F", 350000, 60], ["Prothèse complète bimaxillaire résine", "SPR", 170, 90]
];

export async function seedIfEmpty() {
  const now = new Date().toISOString();

  if (!(await comptes.list()).length) {
    await comptes.replaceAll([
      { id: "u-secretaire", identifiant: "secretaire", alias: ["secretaire"], nom: "Secrétaire", role: "secretaire", password: "Secret2026", actif: true, createdAt: now },
      { id: "u-drpaul", identifiant: "drpaul", alias: ["drpaul", "paul"], nom: "Dr Paul", role: "docteur", password: "Paul2026", actif: true, createdAt: now },
      { id: "u-drdeffo", identifiant: "drdeffo", alias: ["drdeffo", "deffo"], nom: "Dr Deffo", role: "admin", password: "Deffo2026", actif: true, createdAt: now }
    ]);
  }

  // Version 3 : catalogue, entreprises, factures et soins de démonstration (les comptes ne sont jamais touchés).
  if (localStorage.getItem(DATA_KEY) !== "3") {
    localStorage.setItem(DATA_KEY, "3");
    const P: [string, string, string, string, string, string, string, string, string, NatureConsultation][] = [
      ["Bouba", "Awa", "1992-04-12", "Garoua", "Enseignante", "Quartier Roumdé Adjia", "Mariée", "655 12 34 56", "", "standard"],
      ["Mbarga", "Jean", "1985-09-03", "Yaoundé", "Commerçant", "Quartier Foulbéré", "Marié", "677 45 67 89", "Activa", "assurance"],
      ["Aboubakar", "Fatimatou", "2001-01-27", "Maroua", "Étudiante", "Quartier Poumpoumré", "Célibataire", "699 11 22 33", "", "express"],
      ["Ndongo", "Samuel", "1978-11-15", "Douala", "Ingénieur", "Quartier Lopéré", "Marié", "655 98 76 54", "", "standard"],
      ["Hamadou", "Mariam", "1996-06-30", "Garoua", "Infirmière", "Quartier Pitoaré", "Célibataire", "677 33 44 55", "Saham", "assurance"],
      ["Nkoulou", "Pierre", "1969-02-08", "Bafoussam", "Retraité", "Quartier Bocklé", "Veuf", "699 77 88 99", "", "standard"]
    ];
    await patients.replaceAll(P.map(([nom, prenom, naissance, lieu, pro, res, sit, tel, ass, nat], i) => ({
      id: `p${i + 1}`, numeroDossier: `DJ-2026-${String(i + 1).padStart(4, "0")}`, nom, prenom,
      dateNaissance: naissance, lieuNaissance: lieu, age: calculerAge(naissance), profession: pro, residence: res,
      situationMatrimoniale: sit, telephone: tel, assurance: ass, personneUrgence: "Frère — 655 00 11 22",
      natureConsultation: nat, assuranceNom: ass, createdAt: now
    })));

    const A: Acte[] = ACTES.map(([libelle, lettre, coefficient, dureeMinutes], i) => ({
      id: `a${i + 1}`, libelle, lettre, coefficient, prixNonAssure: 0, dureeMinutes, actif: true
    }));
    await actes.replaceAll(A);
    // Pourcentages et coordonnées : valeurs d'exemple, à remplacer par celles du cabinet.
    await entreprises.replaceAll([
      { id: "e1", nom: "SODECOTON", bp: "BP : 302 GAROUA", contribuable: "M057400000146H", rccm: "RC/GOU/2007/B/71", telephone: "22 27 10 80", partPatient: 25, bonRequis: true },
      { id: "e2", nom: "Activa", bp: "", contribuable: "", rccm: "", telephone: "", partPatient: 25, bonRequis: true },
      { id: "e3", nom: "Saham", bp: "", contribuable: "", rccm: "", telephone: "", partPatient: 25, bonRequis: true }
    ]);

    // Historique de factures sur ~6 mois, pour que les graphiques soient parlants.
    let graine = 7;
    const rnd = () => (graine = (graine * 9301 + 49297) % 233280) / 233280;
    const ent: Record<string, string> = { p2: "e2", p5: "e3" };
    const F: Facture[] = [], S: Soin[] = [];
    for (let i = 0; i < 36; i++) {
      const pid = `p${(i % 6) + 1}`, assure = pid in ent, date = addDays(-(i * 5 + Math.floor(rnd() * 4)));
      const nb = 1 + Math.floor(rnd() * 3);
      const lignes: LigneSoin[] = Array.from({ length: nb }, () => {
        const a = A[Math.floor(rnd() * 20)];
        return { acteId: a.id, code: libelleCode(a), libelle: a.libelle, qte: 1, montant: prixActe(a, assure) };
      });
      const total = lignes.reduce((s, l) => s + l.montant, 0);
      const { partPatient, netEntreprise } = repartition(total, assure, 25);
      const frac = [1, 1, 1, 0.5, 0, 0.7][i % 6] ?? 1;
      const paiements: Paiement[] = [];
      const payePatient = i > 12 ? partPatient : Math.round(partPatient * frac);
      if (payePatient > 0) paiements.push({ id: uid(), date, montant: payePatient, mode: i % 3 ? "especes" : "mobile_money", payeur: "patient" });
      if (assure && i > 8 && addDays(-(i * 5) + 15) <= isoDay()) paiements.push({ id: uid(), date: addDays(-(i * 5) + 15), montant: netEntreprise, mode: "assurance", payeur: "entreprise" });
      const paye = paiements.reduce((s, p) => s + p.montant, 0);
      const id = `f${i + 1}`;
      F.push({ id, numero: `${String(300 + (36 - i)).padStart(4, "0")}/2026`, patientId: pid, soinId: `s${i + 1}`, dateEmission: date, lignes, montantTotal: total,
        entrepriseId: ent[pid] ?? "", bonPriseEnCharge: assure ? String(88000 + i) : "", partPatientPct: assure ? 25 : 0, partPatient, netEntreprise,
        paiements, montantPaye: paye, statut: statutDe(total, paye) });
      S.push({ id: `s${i + 1}`, patientId: pid, dateSoin: date, dents: String(11 + (i % 8) * 4 % 38), natureActes: lignes.map((l) => l.libelle).join(", "),
        montantTotal: total, montantPaye: paye, dateProchainRdv: "", praticien: i % 2 ? "Dr Paul" : "Dr Deffo", lignes, factureId: id, createdAt: now });
    }
    await factures.replaceAll(F);
    await soins.replaceAll(S);

    await dossiers.replaceAll([{
      id: "d2", patientId: "p2", dateConsultation: isoDay(), motif: "Douleur sur la dent 36 depuis une semaine",
      histoireMaladie: "Douleur vive au froid et à la mastication, apparue il y a 7 jours.", antecedents: "Aucun antécédent notable.",
      exobuccal: { "Ouverture buccale": "Normale", ATM: "RAS", Adénopathie: "Absente", Autres: "" },
      endobuccal: { Tartre: "Modéré", Halitose: "Absente", Gencive: "Légèrement inflammatoire", Muqueuse: "Normale", Diastème: "", DDM: "" },
      examenMc: "", examensComplementaires: "Radio panoramique", commentaireExamens: "",
      diagnostic: "Carie profonde de la 36", cat: "Dévitalisation puis obturation",
      odontogramme: { "36": ["C", "DC"], "46": ["O"], "18": ["A"] },
      historique: [{ date: now, par: "Dr Deffo", resume: "Dossier créé" }], createdAt: now, updatedAt: now
    }]);
  }

  // Les rendez-vous sont recréés chaque jour pour que la démonstration ait toujours des RDV « du jour ».
  const today = isoDay();
  if (localStorage.getItem(DAY_KEY) === today) return;
  localStorage.setItem(DAY_KEY, today);
  const tomorrow = addDays(1);
  const mk = (id: string, patientId: string, docteurId: string, dateRdv: string, heureRdv: string, motif: string, statut: StatutRdv): RendezVous =>
    ({ id, patientId, docteurId, dateRdv, heureRdv, dureeMinutes: 30, motif, statut, createdAt: now });
  await rdvs.replaceAll([
    mk("r1", "p1", "u-drdeffo", today, "08:30", "Détartrage", "termine"),
    mk("r2", "p2", "u-drpaul", today, "09:30", "Extraction", "confirme"),
    mk("r3", "p3", "u-drdeffo", today, "10:15", "Contrôle", "confirme"),
    mk("r4", "p4", "u-drpaul", today, "11:00", "Carie", "planifie"),
    mk("r5", "p5", "u-drdeffo", today, "14:00", "Appareil", "planifie"),
    mk("r6", "p6", "u-drpaul", tomorrow, "09:00", "Consultation", "confirme"),
    mk("r7", "p1", "u-drdeffo", tomorrow, "10:00", "Détartrage", "planifie"),
    mk("r8", "p3", "u-drpaul", tomorrow, "11:30", "Obturation", "planifie"),
    mk("r9", "p4", "u-drdeffo", tomorrow, "15:00", "Contrôle", "planifie")
  ]);
  const rp = (id: string, rdvId: string, patientId: string, statut: RappelWhatsapp["statut"]): RappelWhatsapp =>
    ({ id, rdvId, patientId, statut, datePrevue: today });
  await rappels.replaceAll([
    rp("w1", "r6", "p6", "confirme"), rp("w2", "r7", "p1", "programme"),
    rp("w3", "r8", "p3", "echoue"), rp("w4", "r9", "p4", "programme")
  ]);
}
