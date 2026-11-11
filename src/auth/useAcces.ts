import { useAuth } from "./AuthContext";

// Règles d'accès : un docteur ne voit que les patients qui ont (ou ont eu) un RDV avec lui, et ne modifie rien.
export function useAcces() {
  const { user, role, readOnly, viewAsDoctor } = useAuth();
  const docteurId = role === "docteur"
    ? user?.role === "docteur" ? user.id : viewAsDoctor?.id ?? null
    : null;
  return { docteurId, peutEditer: role !== "docteur" && !readOnly };
}
