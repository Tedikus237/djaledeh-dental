import { createContext } from "react";
import type { User } from "@/types";

export interface AuthState {
  user: User | null;
  loading: boolean;
  login: (login: string, motDePasse: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);