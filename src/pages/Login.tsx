import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { homePath, useAuth } from "@/auth/AuthContext";
import { IconAlert } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { ToothHero } from "@/components/ToothHero";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

interface Errs { identifiant?: string; password?: string; form?: string }

export default function Login() {
  const { login, role, ready } = useAuth();
  const nav = useNavigate();
  const [identifiant, setIdentifiant] = useState("");
  const [password, setPassword] = useState("");
  const [errs, setErrs] = useState<Errs>({});
  const [loading, setLoading] = useState(false);

  if (ready && role) return <Navigate to={homePath(role)} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const next: Errs = {};
    if (!identifiant.trim()) next.identifiant = "Saisissez votre identifiant.";
    if (!password) next.password = "Saisissez votre mot de passe.";
    setErrs(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      const u = await login(identifiant, password);
      nav(homePath(u.role), { replace: true });
    } catch (err) {
      setErrs({ form: err instanceof Error ? err.message : "Connexion impossible." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-full md:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-stage p-12 text-white md:flex md:flex-col md:justify-between">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/20 blur-[120px]" />
        <Logo light className="relative" />
        <div className="relative mx-auto"><ToothHero className="w-60 animate-float" /></div>
        <div className="relative max-w-md">
          <p className="eyebrow mb-3 !text-sky-300">Gestion de cabinet</p>
          <h2 className="text-[32px] font-bold leading-[1.1]">Chaque dossier, chaque rendez-vous, au bon endroit.</h2>
          <p className="mt-4 text-sm text-white/60">Cabinet Dentaire DJALEDEH — Garoua</p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-rise">
          <Logo className="mb-10 md:hidden" />
          <p className="eyebrow mb-2">Connexion</p>
          <h1 className="text-[28px] font-bold">Accédez à votre espace</h1>
          <p className="mt-2 text-sm text-mute">Saisissez l'identifiant de votre poste et votre mot de passe.</p>
          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            <Input label="Identifiant" placeholder="secrétaire" autoComplete="username" autoCapitalize="none" value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} error={errs.identifiant} />
            <Input label="Mot de passe" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errs.password} />
            {errs.form && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-danger"><IconAlert size={16} className="mt-0.5 shrink-0" />{errs.form}</div>
            )}
            <Button type="submit" className="w-full" loading={loading}>Se connecter</Button>
          </form>
        </div>
      </main>
    </div>
  );
}
