import type { Patient, RendezVous, DossierMedical, Facture, Acte, Entreprise, Compte } from "@/types";
import {
  firestoreCreate,
  firestoreGet,
  firestoreList,
  firestoreRemove,
  firestoreUpdate,
  isFirebaseBackend,
  type DataFilter,
} from "./firebase";

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
    async list(filters: DataFilter[] = []): Promise<T[]> {
      if (isFirebaseBackend()) return firestoreList<T>(name, filters);
      return read<T>(name).filter((row) => filters.every(({ field, operator, value }) => {
        const fieldValue = (row as Record<string, unknown>)[field];
        return operator === "==" ? fieldValue === value : Array.isArray(fieldValue) && fieldValue.includes(value);
      }));
    },
    async get(id: string): Promise<T | null> {
      return isFirebaseBackend()
        ? firestoreGet<T>(name, id)
        : read<T>(name).find((r) => r.id === id) ?? null;
    },
    async create(data: Omit<T, "id">): Promise<T> {
      const id = uid();
      if (isFirebaseBackend()) return firestoreCreate<T>(name, id, data);
      const row = { ...data, id } as unknown as T;
      write(name, [...read<T>(name), row]);
      return row;
    },
    async update(id: string, patch: Partial<T>): Promise<void> {
      if (isFirebaseBackend()) {
        await firestoreUpdate<T>(name, id, patch);
        return;
      }
      write(name, read<T>(name).map((r) => (r.id === id ? { ...r, ...patch } : r)));
    },
    async remove(id: string): Promise<void> {
      if (isFirebaseBackend()) return firestoreRemove(name, id);
      write(name, read<T>(name).filter((r) => r.id !== id));
    },
    async replaceAll(rows: T[]): Promise<void> {
      if (isFirebaseBackend()) {
        throw new Error("Le remplacement complet d'une collection est désactivé sur le stockage partagé.");
      }
      write(name, rows);
    }
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
    isFirebaseBackend()
      ? firestoreGet<T>(collectionName(coll), id)
      : read<T>(collectionName(coll)).find((row) => row.id === id) ?? null,
  list: async <T extends { id: string }>(coll: CollectionName): Promise<T[]> =>
    isFirebaseBackend() ? firestoreList<T>(collectionName(coll)) : read<T>(collectionName(coll)),
  create: async <T extends { id: string }>(coll: CollectionName, data: Omit<T, "id">): Promise<T> => {
    const name = collectionName(coll);
    const id = uid();
    if (isFirebaseBackend()) return firestoreCreate<T>(name, id, data);
    const row = { ...data, id } as T;
    write(name, [...read<T>(name), row]);
    return row;
  },
  update: async <T extends { id: string }>(coll: CollectionName, id: string, patch: Partial<T>): Promise<T | null> => {
    const name = collectionName(coll);
    if (isFirebaseBackend()) return firestoreUpdate<T>(name, id, patch);
    const rows = read<T>(name);
    const current = rows.find((row) => row.id === id);
    if (!current) return null;
    const updated = { ...current, ...patch };
    write(name, rows.map((row) => row.id === id ? updated : row));
    return updated;
  },
  remove: async (coll: CollectionName, id: string): Promise<void> => {
    const name = collectionName(coll);
    if (isFirebaseBackend()) return firestoreRemove(name, id);
    write(name, read<{ id: string }>(name).filter((row) => row.id !== id));
  }
};

export const collections = db;