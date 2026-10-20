import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { homePath, useAuth } from "@/auth/AuthContext";
import { IconCalendar, IconChart, IconClipboard, IconHome, IconLogout, IconMenu, IconMoney, IconSearch, IconSettings, IconUsers, IconWhatsApp, IconX, type IconProps } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { initiales } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

type NavItem = { to: string; label: string; icon: (p: IconProps) => ReactNode };

const NAV: Record<Role, NavItem[]> = {
  secretaire: [
    { to: "/secretaire", label: "Tableau de bord", icon: IconHome },
    { to: "/patients", label: "Patients", icon: IconUsers },
    { to: "/rendez-vous", label: "Rendez-vous", icon: IconCalendar },
    { to: "/factures", label: "Factures", icon: IconMoney },
    { to: "/whatsapp", label: "Rappels WhatsApp", icon: IconWhatsApp }
  ],
  docteur: [
    { to: "/docteur", label: "Tableau de bord", icon: IconHome },
    { to: "/patients", label: "Patients", icon: IconUsers },
    { to: "/rendez-vous", label: "Rendez-vous", icon: IconCalendar }
  ],
  admin: [
    { to: "/admin", label: "Vue d'ensemble", icon: IconHome },
    { to: "/admin/facturation", label: "Tableau financier", icon: IconChart },
    { to: "/patients", label: "Patients", icon: IconUsers },
    { to: "/rendez-vous", label: "Rendez-vous", icon: IconCalendar },
    { to: "/factures", label: "Factures", icon: IconMoney },
    { to: "/whatsapp", label: "Rappels WhatsApp", icon: IconWhatsApp },
    { to: "/admin/catalogue", label: "Catalogue des actes", icon: IconClipboard },
    { to: "/admin/entreprises", label: "Entreprises", icon: IconSettings }
  ]
};

const LABEL: Record<Role, string> = { secretaire: "secrétaire", docteur: "docteur", admin: "administrateur" };

export function AppShell({ children }: { children: ReactNode }) {
  const { user, role, viewAs, logout, startViewAs, stopViewAs } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  if (!user || !role) return null;

  const voir = (r: Role) => { startViewAs(r); setOpen(false); nav(homePath(r)); };
  const revenir = () => { stopViewAs(); nav("/admin"); };

  return (
    <div className="flex min-h-full">
      {open && <div className="fixed inset-0 z-30 bg-ink/40 md:hidden" onClick={() => setOpen(false)} />}

      <aside className={cn("print:hidden fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-line bg-white transition-transform md:static md:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center justify-between px-5 py-5">
          <Logo />
          <button className="text-mute md:hidden" onClick={() => setOpen(false)} aria-label="Fermer le menu"><IconX size={20} /></button>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {NAV[role].map((it) => (
            <NavLink key={it.to} to={it.to} onClick={() => setOpen(false)}
              className={({ isActive }) => cn("flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors md:h-10", isActive ? "bg-canvas text-ink" : "text-mute hover:bg-canvas hover:text-ink")}>
              <it.icon size={18} />{it.label}
            </NavLink>
          ))}
        </nav>
        {user.role === "admin" && (
          <div className="border-t border-line p-3">
            <p className="eyebrow mb-2 px-2">Voir l'interface</p>
            {(["secretaire", "docteur"] as Role[]).map((r) => (
              <button key={r} onClick={() => voir(r)} className={cn("flex h-11 w-full items-center rounded-xl px-3 text-left text-sm capitalize transition-colors md:h-10", viewAs === r ? "bg-ink text-white" : "text-mute hover:bg-canvas hover:text-ink")}>
                {LABEL[r]}
              </button>
            ))}
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {viewAs && (
          <div className="bg-ink px-4 py-2 text-center text-[13px] text-white">
            Consultation de l'interface {LABEL[viewAs]} (lecture seule)
            <button onClick={revenir} className="ml-3 font-semibold underline underline-offset-2">Revenir à mon espace</button>
          </div>
        )}
        <header className="print:hidden sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/85 px-4 backdrop-blur md:px-8">
          <button className="text-ink md:hidden" onClick={() => setOpen(true)} aria-label="Ouvrir le menu"><IconMenu size={22} /></button>
          <div className="relative hidden max-w-sm flex-1 md:block">
            <IconSearch size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input type="search" placeholder="Rechercher un patient…" aria-label="Rechercher un patient"
              onKeyDown={(e) => { if (e.key === "Enter") nav(`/patients?q=${encodeURIComponent(e.currentTarget.value)}`); }}
              className="h-10 w-full rounded-xl border border-line bg-canvas pl-10 pr-3 text-sm placeholder:text-faint focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/15" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-right leading-tight sm:block">
              <span className="block text-sm font-semibold">{user.nom}</span>
              <span className="block text-xs text-faint">{LABEL[user.role]}</span>
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-xs font-semibold text-white">{initiales(user.nom)}</span>
            <button onClick={logout} aria-label="Se déconnecter" className="grid h-11 w-11 place-items-center rounded-xl text-mute transition-colors hover:bg-canvas hover:text-ink md:h-10 md:w-10"><IconLogout size={18} /></button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}
