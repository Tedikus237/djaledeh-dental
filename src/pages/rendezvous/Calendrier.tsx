import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { db, collections } from "@/data/db";
import { useAuth } from "@/contexts/useAuth";
import type { RendezVous, Patient, User } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Status } from "@/components/ui/Status";
import { Skeleton } from "@/components/ui/Skeleton";

function jourIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function labelMois(d: Date): string {
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function labelHeure(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function CalendrierRdv() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rdvs, setRdvs] = useState<RendezVous[]>([]);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [praticiens, setPraticiens] = useState<User[]>([]);
  const [filtrePraticien, setFiltrePraticien] = useState<string>("tous");
  const [moisCourant, setMoisCourant] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  useEffect(() => {
    (async () => {
      const [rs, ps, us] = await Promise.all([
        db.list<RendezVous>(collections.rdvs),
        db.list<Patient>(collections.patients),
        db.list<User>(collections.users),
      ]);
      const map: Record<string, Patient> = {};
      for (const p of ps) map[p.id] = p;
      setPatients(map);
      setRdvs(rs);
      setPraticiens(us.filter((u) => u.role === "docteur" || u.role === "admin"));
      setLoading(false);
    })();
  }, []);

  const jours = useMemo(() => {
    const debut = new Date(moisCourant);
    debut.setDate(1);
    const fin = new Date(debut);
    fin.setMonth(fin.getMonth() + 1);
    fin.setDate(0);

    const premierJourSemaine = (debut.getDay() + 6) % 7; // lundi = 0
    const grille: (Date | null)[] = [];
    for (let i = 0; i < premierJourSemaine; i++) grille.push(null);
    for (let j = 1; j <= fin.getDate(); j++) {
      grille.push(new Date(debut.getFullYear(), debut.getMonth(), j));
    }
    return grille;
  }, [moisCourant]);

  const rdvsFiltres = useMemo(() => {
    let list = rdvs;
    if (user?.role === "docteur") {
      list = list.filter((r) => r.praticienId === user.id);
    } else if (filtrePraticien !== "tous") {
      list = list.filter((r) => r.praticienId === filtrePraticien);
    }
    return list;
  }, [rdvs, user, filtrePraticien]);

  function rdvsDuJour(d: Date): RendezVous[] {
    const j = jourIso(d);
    return rdvsFiltres.filter((r) => jourIso(new Date(r.date)) === j);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const nomPraticien = (id: string) => praticiens.find((u) => u.id === id)?.nom ?? "—";

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
            Rendez-vous
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
            Calendrier
          </h1>
        </div>
        <div className="flex gap-2">
          {user?.role === "admin" || user?.role === "secretaire" ? (
            <select
              value={filtrePraticien}
              onChange={(e) => setFiltrePraticien(e.target.value)}
              className="h-10 px-3 rounded-lg bg-panel border border-line text-sm text-ink focus:outline-none focus:border-accent"
            >
              <option value="tous">Tous les praticiens</option>
              {praticiens.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom}
                </option>
              ))}
            </select>
          ) : null}
          <Link to="/rendez-vous/nouveau">
            <Button size="sm">Nouveau RDV</Button>
          </Link>
        </div>
      </header>

      <Card title={labelMois(moisCourant)} accent="accent">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const d = new Date(moisCourant);
              d.setMonth(d.getMonth() - 1);
              setMoisCourant(d);
            }}
          >
            ← Mois précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const d = new Date();
              d.setDate(1);
              setMoisCourant(d);
            }}
          >
            Aujourd'hui
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const d = new Date(moisCourant);
              d.setMonth(d.getMonth() + 1);
              setMoisCourant(d);
            }}
          >
            Mois suivant →
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-faint mb-2">
          <div>Lun</div>
          <div>Mar</div>
          <div>Mer</div>
          <div>Jeu</div>
          <div>Ven</div>
          <div>Sam</div>
          <div>Dim</div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {jours.map((d, i) => {
            if (!d) return <div key={i} />;
            const liste = rdvsDuJour(d);
            const auj = jourIso(d) === jourIso(new Date());
            return (
              <div
                key={i}
                className={
                  "min-h-[90px] rounded-lg border p-2 text-left " +
                  (auj ? "border-accent bg-accent/5" : "border-line bg-panel")
                }
              >
                <p
                  className={
                    "text-xs font-semibold " + (auj ? "text-accent" : "text-ink")
                  }
                >
                  {d.getDate()}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {liste.slice(0, 3).map((r) => {
                    const p = patients[r.patientId];
                    return (
                      <li key={r.id} className="text-[10px] leading-tight truncate">
                        <span className="text-faint">{labelHeure(r.date)}</span>{" "}
                        <span className="text-ink">
                          {p ? `${p.nom} ${p.prenom}` : "?"}
                        </span>
                      </li>
                    );
                  })}
                  {liste.length > 3 && (
                    <li className="text-[10px] text-faint">+{liste.length - 3} autres</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Prochains rendez-vous" accent="accent">
        {rdvsFiltres.length === 0 ? (
          <p className="text-sm text-faint">Aucun rendez-vous.</p>
        ) : (
          <ul className="divide-y divide-line">
            {rdvsFiltres
              .filter((r) => new Date(r.date) >= new Date())
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(0, 8)
              .map((r) => {
                const p = patients[r.patientId];
                return (
                  <li key={r.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {p ? `${p.nom} ${p.prenom}` : "Patient inconnu"}
                      </p>
                      <p className="text-xs text-faint">
                        {new Date(r.date).toLocaleDateString("fr-FR")} {labelHeure(r.date)} —{" "}
                        {nomPraticien(r.praticienId)} — {r.motif || "sans motif"}
                      </p>
                    </div>
                    <Status
                      tone={
                        r.statut === "confirme"
                          ? "success"
                          : r.statut === "annule"
                          ? "danger"
                          : "warning"
                      }
                    >
                      {r.statut === "confirme"
                        ? "Confirmé"
                        : r.statut === "annule"
                        ? "Annulé"
                        : "À confirmer"}
                    </Status>
                  </li>
                );
              })}
          </ul>
        )}
      </Card>
    </div>
  );
}