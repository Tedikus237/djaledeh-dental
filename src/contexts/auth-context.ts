import { createContext } from "react";
import type { Compte } from "@/types";

export interface AuthState {
  user: Compte | null;
  loading: boolean;
  login: (login: string, motDePasse: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);