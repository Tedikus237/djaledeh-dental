import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { comptes } from "@/data/services";
import { seedIfEmpty } from "@/data/seed";
import {
  connectFirebaseUser,
  disconnectFirebaseUser,
  isFirebaseBackend,
  persistFirebaseSession,
  watchFirebaseUser,
} from "@/data/firebase";
import type { Compte, Role } from "@/types";

const SESSION = "djaledeh:session";
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");

interface Ctx {
  user: Compte | null;
  viewAsDoctor: Compte | null;
  role: Role | null;
  viewAs: Role | null;
  readOnly: boolean;
  ready: boolean;
  connectionError: string | null;
  login: (identifiant: string, password: string) => Promise<Compte>;
  logout: () => Promise<void>;
  startViewAs: (r: Role) => Promise<boolean>;
  stopViewAs: () => void;
}

const AuthContext = createContext<Ctx | undefined>(undefined);

export const homePath = (r: Role) => (r === "admin" ? "/admin" : r === "docteur" ? "/docteur" : "/secretaire");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Compte | null>(null);
  const [viewAs, setViewAs] = useState<Role | null>(null);
  const [viewAsDoctor, setViewAsDoctor] = useState<Compte | null>(null);
  const [ready, setReady] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (isFirebaseBackend()) {
      let active = true;
      const unsubscribe = watchFirebaseUser((firebaseUser) => {
        if (!firebaseUser) {
          if (active) {
            setUser(null);
            setReady(true);
          }
          return;
        }

        void comptes.get(firebaseUser.uid).then(async (account) => {
          if (!active) return;
          if (!account?.actif) {
            await disconnectFirebaseUser();
            setUser(null);
            setConnectionError("Ce compte n'est pas activé dans le cabinet. Contactez l'administrateur.");
          } else {
            setUser(account);
            setConnectionError(null);
          }
          setReady(true);
        }).catch((error: unknown) => {
          if (active) {
            setUser(null);
            setConnectionError(error instanceof Error ? error.message : "Impossible de charger le compte du cabinet.");
            setReady(true);
          }
        });
      }, (error) => {
        if (active) {
          setConnectionError(error.message);
          setReady(true);
        }
      });

      return () => {
        active = false;
        unsubscribe();
      };
    }

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
    if (isFirebaseBackend()) {
      await persistFirebaseSession();
      const firebaseUser = await connectFirebaseUser(identifiant, password);
      const account = await comptes.get(firebaseUser.user.uid);
      if (!account?.actif) {
        await disconnectFirebaseUser();
        throw new Error("Ce compte n'est pas activé dans le cabinet. Contactez l'administrateur.");
      }
      setConnectionError(null);
      setUser(account);
      setViewAs(null);
      setViewAsDoctor(null);
      return account;
    }

    const key = norm(identifiant);
    const c = (await comptes.list()).find((x) => x.actif && x.alias.includes(key));
    if (!c || c.password !== password) throw new Error("Identifiant ou mot de passe incorrect.");
    localStorage.setItem(SESSION, c.id);
    setUser(c);
    setViewAs(null);
    setViewAsDoctor(null);
    return c;
  }, []);

  const logout = useCallback(async () => {
    if (isFirebaseBackend()) {
      try {
        await disconnectFirebaseUser();
      } catch (error) {
        setConnectionError(error instanceof Error ? error.message : "La déconnexion Firebase a échoué.");
        return;
      }
    }
    localStorage.removeItem(SESSION);
    setUser(null);
    setViewAs(null);
    setViewAsDoctor(null);
  }, []);

  const startViewAs = useCallback(async (r: Role) => {
    if (user?.role !== "admin") return false;
    setConnectionError(null);
    if (r === "docteur") {
      try {
        const doctor = (await comptes.list()).find((account) => account.role === "docteur" && account.actif);
        if (!doctor) throw new Error("Aucun compte docteur actif n’est configuré.");
        setViewAsDoctor(doctor);
      } catch (error) {
        setConnectionError(`Impossible de charger le compte du docteur pour l’aperçu : ${error instanceof Error ? error.message : "erreur inconnue."}`);
        return false;
      }
    } else {
      setViewAsDoctor(null);
    }
    setViewAs(r);
    return true;
  }, [user]);
  const stopViewAs = useCallback(() => {
    setViewAs(null);
    setViewAsDoctor(null);
    setConnectionError(null);
  }, []);

  const value = useMemo<Ctx>(() => ({
    user, viewAsDoctor, role: user ? viewAs ?? user.role : null, viewAs, readOnly: viewAs !== null,
    ready, connectionError, login, logout, startViewAs, stopViewAs
  }), [user, viewAsDoctor, viewAs, ready, connectionError, login, logout, startViewAs, stopViewAs]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
