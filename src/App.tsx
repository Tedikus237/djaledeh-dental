import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { homePath, useAuth } from "@/auth/AuthContext";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import type { Role } from "@/types";
import Dossier from "@/pages/dossier/Dossier";
import FichePatient from "@/pages/patients/Fiche";
import ListePatients from "@/pages/patients/Liste";
import NouveauPatient from "@/pages/patients/Nouveau";
import CorbeillePatients from "@/pages/patients/Corbeille";
import Login from "@/pages/Login";
import Catalogue from "@/pages/admin/Catalogue";
import DashboardAdmin from "@/pages/admin/Dashboard";
import Entreprises from "@/pages/admin/Entreprises";
import Facturation from "@/pages/admin/Facturation";
import DetailFacture from "@/pages/factures/Detail";
import ListeFactures from "@/pages/factures/Liste";
import DashboardDocteur from "@/pages/docteur/Dashboard";
import DashboardSecretaire from "@/pages/secretaire/Dashboard";

// 👇 IMPORTS POUR LES RENDEZ-VOUS ET WHATSAPP 👇
import Calendrier from "@/pages/rendezvous/Calendrier";
import NouveauRDV from "@/pages/rendezvous/Nouveau";
import Rappels from "@/pages/rendezvous/Rappels";

function Racine() {
  const { role, ready } = useAuth();
  if (!ready) return null;
  return <Navigate to={role ? homePath(role) : "/login"} replace />;
}

const page = (allow: Role[], el: ReactNode) => (
  <ProtectedRoute allow={allow}><AppShell>{el}</AppShell></ProtectedRoute>
);

const TOUS: Role[] = ["secretaire", "docteur", "admin"];
const GESTION: Role[] = ["secretaire", "admin"];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/secretaire" element={page(["secretaire"], <DashboardSecretaire />)} />
      <Route path="/docteur" element={page(["docteur"], <DashboardDocteur />)} />
      <Route path="/admin" element={page(["admin"], <DashboardAdmin />)} />
      <Route path="/admin/facturation" element={page(["admin"], <Facturation />)} />
      <Route path="/admin/catalogue" element={page(["admin"], <Catalogue />)} />
      <Route path="/admin/entreprises" element={page(["admin"], <Entreprises />)} />
      <Route path="/patients" element={page(TOUS, <ListePatients />)} />
      <Route path="/patients/nouveau" element={page(GESTION, <NouveauPatient />)} />
      <Route path="/patients/corbeille" element={page(GESTION, <CorbeillePatients />)} />
      <Route path="/patients/:id" element={page(TOUS, <FichePatient />)} />
      <Route path="/patients/:id/dossier" element={page(TOUS, <Dossier />)} />
      
      {/* 👇 ROUTES RENDEZ-VOUS 👇 */}
      <Route path="/rendez-vous" element={page(TOUS, <Calendrier />)} />
      <Route path="/rendez-vous/nouveau" element={page(GESTION, <NouveauRDV />)} />

      <Route path="/factures" element={page(GESTION, <ListeFactures />)} />
      <Route path="/factures/:id" element={page(GESTION, <DetailFacture />)} />
      
      {/* 👇 ROUTE WHATSAPP 👇 */}
      <Route path="/whatsapp" element={page(TOUS, <Rappels />)} />
      
      <Route path="/" element={<Racine />} />
      <Route path="*" element={<Racine />} />
    </Routes>
  );
}