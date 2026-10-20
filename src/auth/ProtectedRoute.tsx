import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { Role } from "@/types";
import { homePath, useAuth } from "./AuthContext";

export function ProtectedRoute({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { role, ready } = useAuth();
  if (!ready) return <div className="grid h-full place-items-center text-sm text-mute">Chargement…</div>;
  if (!role) return <Navigate to="/login" replace />;
  if (!allow.includes(role)) return <Navigate to={homePath(role)} replace />;
  return <>{children}</>;
}
