import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  arrayUnion,
  collection as firestoreCollection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredConfig = ["apiKey", "authDomain", "projectId", "appId"] as const;
const hasFirebaseConfig = requiredConfig.every((key) => Boolean(config[key]));

const READ_CACHE_TTL_MS = 15_000;
type ReadCacheEntry = {
  expiresAt: number;
  hasValue: boolean;
  value?: unknown;
  pending?: Promise<unknown>;
};
const readCache = new Map<string, ReadCacheEntry>();

async function cachedRead<T>(key: string, load: () => Promise<T>): Promise<T> {
  const cached = readCache.get(key);
  if (cached?.hasValue && cached.expiresAt > Date.now()) return cached.value as T;
  if (cached?.pending) return cached.pending as Promise<T>;

  const entry: ReadCacheEntry = { expiresAt: 0, hasValue: false };
  entry.pending = load()
    .then((value) => {
      if (readCache.get(key) === entry) {
        entry.value = value;
        entry.hasValue = true;
        entry.expiresAt = Date.now() + READ_CACHE_TTL_MS;
        entry.pending = undefined;
      }
      return value;
    })
    .catch((error: unknown) => {
      if (readCache.get(key) === entry) readCache.delete(key);
      throw error;
    });
  readCache.set(key, entry);
  return entry.pending as Promise<T>;
}

function invalidateReadCache(name: string) {
  const listPrefix = `list:${name}:`;
  const documentPrefix = `document:${name}:`;
  for (const key of readCache.keys()) {
    if (key.startsWith(listPrefix) || key.startsWith(documentPrefix)) readCache.delete(key);
  }
}

export function clearFirebaseReadCache() {
  readCache.clear();
}

export const isFirebaseBackend = () =>
  import.meta.env.VITE_DATA_BACKEND === "firebase";

export function getFirebaseApp() {
  if (!hasFirebaseConfig) {
    throw new Error(
      "Firebase n'est pas configuré. Copiez .env.example dans .env.local et renseignez la configuration Web de votre projet."
    );
  }
  return getApps().length ? getApp() : initializeApp(config);
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  try {
    return getAuth(app);
  } catch {
    return initializeAuth(app, { persistence: indexedDBLocalPersistence });
  }
}

export function getFirebaseDb() {
  return getFirestore(getFirebaseApp());
}

export function usernameEmail(username: string) {
  const normalized = username.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (!/^[a-z0-9._-]+$/.test(normalized)) {
    throw new Error("Identifiant invalide.");
  }
  return `${normalized}@login.djaledeh.invalid`;
}

export async function connectFirebaseUser(identity: string, password: string) {
  const value = identity.trim();
  const email = value.includes("@") ? value.toLowerCase() : usernameEmail(value);
  clearFirebaseReadCache();
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export async function disconnectFirebaseUser() {
  await signOut(getFirebaseAuth());
  clearFirebaseReadCache();
}

export function watchFirebaseUser(onChange: (user: FirebaseUser | null) => void, onError: (error: Error) => void) {
  try {
    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      clearFirebaseReadCache();
      onChange(user);
    }, onError);
  } catch (error) {
    onError(error instanceof Error ? error : new Error("Impossible d'initialiser Firebase Authentication."));
    return () => undefined;
  }
}

export async function persistFirebaseSession() {
  await setPersistence(getFirebaseAuth(), indexedDBLocalPersistence);
}

export interface DataFilter {
  field: string;
  operator: "==" | "array-contains";
  value: string;
}

export function firestoreFilters(filters: DataFilter[] = []): QueryConstraint[] {
  return filters.map((filter) => where(filter.field, filter.operator, filter.value));
}

export function firestoreCollectionRef(name: string) {
  return firestoreCollection(getFirebaseDb(), name);
}

export function firestoreDocumentRef(name: string, id: string) {
  return doc(getFirebaseDb(), name, id);
}

export async function firestoreList<T extends { id: string }>(name: string, filters: DataFilter[] = []): Promise<T[]> {
  const filterKey = filters.map(({ field, operator, value }) => `${field}:${operator}:${value}`).join("|");
  const rows = await cachedRead(`list:${name}:${filterKey}`, async () => {
    const ref = firestoreCollectionRef(name);
    const constraints = firestoreFilters(filters);
    const snapshot = await getDocs(constraints.length ? query(ref, ...constraints) : ref);
    return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as T);
  });
  return rows.map((row) => ({ ...row }));
}

export async function firestoreGet<T extends { id: string }>(name: string, id: string): Promise<T | null> {
  const value = await cachedRead(`document:${name}:${id}`, async () => {
    const snapshot = await getDoc(firestoreDocumentRef(name, id));
    return snapshot.exists() ? ({ ...snapshot.data(), id: snapshot.id } as T) : null;
  });
  return value ? { ...value } : null;
}

export async function firestoreCreate<T extends { id: string }>(name: string, id: string, data: Omit<T, "id">): Promise<T> {
  const row = { ...data, id } as T & DocumentData;
  await setDoc(firestoreDocumentRef(name, id), row);
  invalidateReadCache(name);
  return row;
}

export async function firestoreCreateAppointment<T extends { id: string; patientId: string; docteurId: string }>(
  id: string,
  data: Omit<T, "id">,
): Promise<T> {
  const db = getFirebaseDb();
  const row = { ...data, id } as T & DocumentData;
  const batch = writeBatch(db);
  batch.set(doc(db, "rendezVous", id), row);
  batch.update(doc(db, "patients", data.patientId), {
    docteurIds: arrayUnion(data.docteurId),
  });
  await batch.commit();
  invalidateReadCache("rendezVous");
  invalidateReadCache("patients");
  return row;
}

export async function firestoreUpdate<T extends { id: string }>(name: string, id: string, patch: Partial<T>): Promise<T | null> {
  const ref = firestoreDocumentRef(name, id);
  const current = await getDoc(ref);
  if (!current.exists()) return null;
  await updateDoc(ref, patch as DocumentData);
  invalidateReadCache(name);
  return { ...current.data(), ...patch, id } as T;
}

export async function firestoreRemove(name: string, id: string) {
  await deleteDoc(firestoreDocumentRef(name, id));
  invalidateReadCache(name);
}

export async function firestoreAddDoctorAccess(name: string, id: string, doctorId: string) {
  await updateDoc(firestoreDocumentRef(name, id), { docteurIds: arrayUnion(doctorId) });
  invalidateReadCache(name);
}
