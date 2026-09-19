import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CreditCard, Eye, EyeOff, Loader2, MessageSquare, ScanLine } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ClientLogin() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [changeError, setChangeError] = useState("");

  const me = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (me.data?.role === "user" && !me.data.mustChangePassword) {
      navigate("/espace-client");
    }
  }, [me.data, navigate]);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoginError("");
    if (!username.trim() || !password) {
      setLoginError("Veuillez renseigner votre identifiant et votre mot de passe.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/client/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });
      const payload = (await response.json()) as { message?: string; mustChangePassword?: boolean };
      if (!response.ok) {
        setLoginError(payload.message ?? "Identifiants invalides.");
        return;
      }

      await utils.auth.me.invalidate();
      if (payload.mustChangePassword) {
        toast.success("Connexion réussie");
        return;
      }
      navigate("/espace-client");
    } catch {
      setLoginError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(event: React.FormEvent) {
    event.preventDefault();
    setChangeError("");
    if (newPassword.length < 12) {
      setChangeError("Le nouveau mot de passe doit contenir au moins 12 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError("Les deux nouveaux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/client/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: password,
          newPassword,
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        setChangeError(payload.message ?? "Impossible de modifier le mot de passe.");
        return;
      }

      setPassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      await utils.auth.me.invalidate();
      toast.success("Mot de passe modifié avec succès");
      navigate("/espace-client");
    } catch {
      setChangeError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const mustChange = me.data?.role === "user" && me.data.mustChangePassword;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f5f7] p-6">
      <div className="w-full max-w-sm">
        <div className="id-card" style={{ padding: "24px 24px 20px" }}>
          <div className="id-card-row">
            <div>
              <div className="id-card-chip" aria-hidden />
              <p className="id-card-brand" style={{ marginTop: 12 }}>
                Support Connecté
              </p>
            </div>
          </div>
          <p className="id-card-name" style={{ fontSize: 20, marginTop: 20 }}>
            Espace client
          </p>
          <p className="id-card-role">
            Accédez à vos fiches, vos scans, vos demandes et vos cartes.
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-[#e6e8ec] bg-white p-6">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Feature icon={ScanLine} label="Scans" />
            <Feature icon={MessageSquare} label="Demandes" />
            <Feature icon={CreditCard} label="Cartes" />
          </div>

          {!mustChange ? (
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <Field label="Identifiant">
                <input
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  placeholder="Votre identifiant"
                />
              </Field>

              <Field label="Mot de passe">
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  visible={showPassword}
                  onToggle={() => setShowPassword(value => !value)}
                  autoComplete="current-password"
                  placeholder="Votre mot de passe"
                />
              </Field>

              {loginError && <ErrorMessage>{loginError}</ErrorMessage>}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#172033] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f1626] disabled:opacity-70"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Connexion…" : "Se connecter"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm leading-5 text-amber-900">
                Pour sécuriser votre compte, vous devez remplacer le mot de passe temporaire avant d'accéder à votre espace client.
              </div>

              <Field label="Nouveau mot de passe">
                <PasswordInput
                  value={newPassword}
                  onChange={setNewPassword}
                  visible={showNewPassword}
                  onToggle={() => setShowNewPassword(value => !value)}
                  autoComplete="new-password"
                  placeholder="12 caractères minimum"
                />
              </Field>

              <Field label="Confirmer le nouveau mot de passe">
                <input
                  required
                  type={showNewPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Répétez le nouveau mot de passe"
                />
              </Field>

              {changeError && <ErrorMessage>{changeError}</ErrorMessage>}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#172033] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f1626] disabled:opacity-70"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Modification…" : "Définir mon nouveau mot de passe"}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-xs text-[#9aa3b1]">
            Utilisez les identifiants transmis par l'administrateur de votre espace client.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-[#7d8798]">
        {label}
      </span>
      {children}
    </label>
  );
}

function PasswordInput({
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete: string;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <input
        required
        type={visible ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="pr-11"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#7d8798] hover:bg-[#f4f5f7]"
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
      {children}
    </p>
  );
}

function Feature({ icon: Icon, label }: { icon: typeof ScanLine; label: string }) {
  return (
    <div>
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef2f6]">
        <Icon size={17} className="text-[#52607a]" />
      </div>
      <p className="mt-2 text-[11.5px] text-[#7d8798]">{label}</p>
    </div>
  );
}
