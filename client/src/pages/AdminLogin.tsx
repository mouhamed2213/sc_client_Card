import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import { LockKeyhole, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_HOME_PATH } from "@/const";
import { trpc } from "@/lib/trpc";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(body.message || "Connexion impossible.");
      }

      // The login endpoint answered 200, but that only proves the credentials
      // are valid, not that the browser kept the session cookie. Read the
      // session back through tRPC before leaving this page: otherwise a
      // dropped cookie makes AdminGuard silently bounce the admin back here.
      const me = await utils.auth.me.fetch();
      if (!me || me.role !== "admin") {
        throw new Error(
          "Identifiants acceptés, mais la session n'a pas été enregistrée par le navigateur (cookie refusé). Vérifiez que le site est servi en HTTPS."
        );
      }

      toast.success("Connexion administrateur réussie.");
      window.location.replace(ADMIN_HOME_PATH);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Connexion impossible."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-md items-center justify-center">
        <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <LockKeyhole className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              Cartes Connectées
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Administration
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Connectez-vous pour gérer les fiches et les médias.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="admin-username">Nom d'utilisateur</Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="admin-username"
                  value={username}
                  onChange={event => setUsername(event.target.value)}
                  autoComplete="username"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">Mot de passe</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  autoComplete="current-password"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Connexion…" : "Se connecter"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
