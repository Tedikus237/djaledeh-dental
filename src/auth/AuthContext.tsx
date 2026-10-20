import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { comptes } from "@/data/services";
import { seedIfEmpty } from "@/data/seed";
import type { Compte, Role } from "@/types";

const SESSION = "djaledeh:session";
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");

interface Ctx {
  user: Compte | null;
  role: Role | null;
  viewAs: Role | null;
  readOnly: boolean;
  ready: boolean;
  login: (identifiant: string, password: string) => Promise<Compte>;
  logout: () => void;
  startViewAs: (r: Role) => void;
  stopViewAs: () => void;
}

const AuthContext = createContext<Ctx | undefined>(undefined);

export const homePath = (r: Role) => (r === "admin" ? "/admin" : r === "docteur" ? "/docteur" : "/secretaire");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Compte | null>(null);
  const [viewAs, setViewAs] = useState<Role | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await seedIfEmpty();
      const id = localStorage.getItem(SESSION);
      if (id) {
        const c = await comptes.get(id);
        if (c?.actif) setUser(c);
      }
      setReady(true);
    })();
  }, []);

  const login = useCallback(async (identifiant: string, password: string) => {
    const key = norm(identifiant);
    const c = (await comptes.list()).find((x) => x.actif && x.alias.includes(key));
    if (!c || c.password !== password) throw new Error("Identifiant ou mot de passe incorrect.");
    localStorage.setItem(SESSION, c.id);
    setUser(c);
    setViewAs(null);
    return c;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION);
    setUser(null);
    setViewAs(null);
  }, []);

  const startViewAs = useCallback((r: Role) => { if (user?.role === "admin") setViewAs(r); }, [user]);
  const stopViewAs = useCallback(() => setViewAs(null), []);

  const value = useMemo<Ctx>(() => ({
    user, role: user ? viewAs ?? user.role : null, viewAs, readOnly: viewAs !== null,
    ready, login, logout, startViewAs, stopViewAs
  }), [user, viewAs, ready, login, logout, startViewAs, stopViewAs]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
