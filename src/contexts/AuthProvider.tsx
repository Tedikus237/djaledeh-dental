import { useEffect, useState, type ReactNode } from "react";
import { AuthContext } from "./auth-context";
import { db, collections } from "@/data/db";
import { seedIfEmpty } from "@/data/seed";
import type { Compte } from "@/types";

const SESSION_KEY = "djaledeh:session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Compte | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await seedIfEmpty();
      const savedId = localStorage.getItem(SESSION_KEY);
      if (savedId) {
        const u = await db.get<Compte>(collections.users, savedId);
        if (u) setUser(u);
      }
      setLoading(false);
    })();
  }, []);

  async function login(loginValue: string, motDePasse: string) {
    const users = await db.list<Compte>(collections.users);
    const found = users.find(
      (u) => u.alias.includes(loginValue.trim().toLowerCase())
    );
    if (!found) return { ok: false, error: "Identifiant inconnu." };
    if (found.password !== motDePasse) return { ok: false, error: "Mot de passe incorrect." };
    setUser(found);
    localStorage.setItem(SESSION_KEY, found.id);
    return { ok: true };
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}