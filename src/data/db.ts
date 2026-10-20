const PREFIX = "djaledeh:";

const read = <T,>(name: string): T[] => {
  try { return JSON.parse(localStorage.getItem(PREFIX + name) ?? "[]") as T[]; } catch { return []; }
};
const write = <T,>(name: string, rows: T[]) => localStorage.setItem(PREFIX + name, JSON.stringify(rows));

export const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);

// Mêmes opérations (asynchrones) que Firestore : ce fichier sera remplacé par Firebase plus tard.
export function collection<T extends { id: string }>(name: string) {
  return {
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
