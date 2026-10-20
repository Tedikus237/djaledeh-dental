import { useAuth } from "./AuthContext";

// Règles d'accès : un docteur ne voit que les patients qui ont (ou ont eu) un RDV avec lui, et ne modifie rien.
export function useAcces() {
  const { user, role, readOnly } = useAuth();
  const docteurId = role === "docteur" ? (user?.role === "docteur" ? user.id : "u-drpaul") : null;
  return { docteurId, peutEditer: role !== "docteur" && !readOnly };
}
