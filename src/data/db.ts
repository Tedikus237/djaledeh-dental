import type { Patient, RendezVous, DossierMedical, Facture, Acte, Entreprise, Compte } from "@/types";

const PREFIX = "djaledeh:";

const read = <T,>(name: string): T[] => {
  try { return JSON.parse(localStorage.getItem(PREFIX + name) ?? "[]") as T[]; } catch { return []; }
};
const write = <T,>(name: string, rows: T[]) => localStorage.setItem(PREFIX + name, JSON.stringify(rows));

export const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);

type CollectionRef = { name: string };
type CollectionName = string | CollectionRef;

const collectionName = (collection: CollectionName) =>
  typeof collection === "string" ? collection : collection.name;

export function collection<T extends { id: string }>(name: string) {
  return {
    name,
    async list(): Promise<T[]> { return read<T>(name); },
    async get(id: string): Promise<T | null> { return read<T>(name).find((r) => r.id === id) ?? null; },
    async create(data: Omit<T, "id">): Promise<T> {
      const row = { ...data, id: uid() } as unknown as T;
      write(name, [...read<T>(name), row]);
      return row;
    },
    async update(id: string, patch: Partial<T>): Promise<void> {
      write(name, read<T>(name).map((r) => (r.id === id ? { ...r, ...patch } : r)));
    },
    async remove(id: string): Promise<void> { write(name, read<T>(name).filter((r) => r.id !== id)); },
    async replaceAll(rows: T[]): Promise<void> { write(name, rows); }
  };
}

const patientsDb = collection<Patient>("patients");
const rdvDb = collection<RendezVous>("rendezVous");
const dossiersDb = collection<DossierMedical>("dossiers");
const facturesDb = collection<Facture>("factures");
const actesDb = collection<Acte>("actes");
const entreprisesDb = collection<Entreprise>("entreprises");
const comptesDb = collection<Compte>("comptes");

// On expose TOUT ce que les pages cherchent
export const db = {
  uid,
  patients: patientsDb,
  rendezVous: rdvDb,
  dossiers: dossiersDb,
  factures: facturesDb,
  actes: actesDb,
  entreprises: entreprisesDb,
  comptes: comptesDb,
  users: comptesDb, 
  // Fonctions génériques "racines" pour les pages qui font db.get(...)
  get: async <T extends { id: string }>(coll: CollectionName, id: string): Promise<T | null> =>
    read<T>(collectionName(coll)).find((row) => row.id === id) ?? null,
  list: async <T>(coll: CollectionName): Promise<T[]> => read<T>(collectionName(coll)),
  create: async <T extends { id: string }>(coll: CollectionName, data: Omit<T, "id">): Promise<T> => {
    const name = collectionName(coll);
    const row = { ...data, id: uid() } as T;
    write(name, [...read<T>(name), row]);
    return row;
  },
  update: async <T extends { id: string }>(coll: CollectionName, id: string, patch: Partial<T>): Promise<T | null> => {
    const name = collectionName(coll);
    const rows = read<T>(name);
    const current = rows.find((row) => row.id === id);
    if (!current) return null;
    const updated = { ...current, ...patch };
    write(name, rows.map((row) => row.id === id ? updated : row));
    return updated;
  },
  remove: async (coll: CollectionName, id: string): Promise<void> => {
    const name = collectionName(coll);
    write(name, read<{ id: string }>(name).filter((row) => row.id !== id));
  }
};

export const collections = db;