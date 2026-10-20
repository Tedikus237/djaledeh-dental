import { Link, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/contexts/useAuth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";

interface Props {
  children: ReactNode;
}

export function AppLayout({ children }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-stage text-ink">
      <header className="border-b border-line bg-stage/90 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <Logo light />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs text-faint hidden sm:inline">{user?.nom}</span>
            <Button variant="outline" size="sm" onClick={onLogout}>
              Se déconnecter
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}