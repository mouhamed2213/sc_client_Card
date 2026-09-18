import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CreditCard, MessageSquare, ScanLine, TriangleAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";

const ERROR_MESSAGES: Record<string, string> = {
  invitation_not_eligible:
    "L'espace client est réservé aux fiches de formule Signature. Contactez votre conseiller si vous pensez qu'il s'agit d'une erreur.",
  invitation_invalid:
    "Ce lien d'invitation n'est plus valable — il a peut-être déjà été utilisé ou a expiré. Demandez un nouveau lien à votre conseiller.",
};

export default function ClientLogin() {
  const [, navigate] = useLocation();
  const [redirecting, setRedirecting] = useState(false);
  const me = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const errorCode = new URLSearchParams(window.location.search).get("error");
  const errorMessage = errorCode ? ERROR_MESSAGES[errorCode] : undefined;

  useEffect(() => {
    if (me.data?.role === "user") navigate("/espace-client");
  }, [me.data, navigate]);

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
            Suivez votre fiche, vos scans et vos demandes.
          </p>
        </div>

        {errorMessage && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#f3d9c9] bg-[#fdf1e2] p-4 text-sm text-[#9a5c10]">
            <TriangleAlert size={16} className="mt-0.5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-[#e6e8ec] bg-white p-6">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Feature icon={ScanLine} label="Scans" />
            <Feature icon={MessageSquare} label="Demandes" />
            <Feature icon={CreditCard} label="Cartes" />
          </div>

          <button
            type="button"
            disabled={redirecting}
            onClick={() => {
              setRedirecting(true);
              startLogin();
            }}
            className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#172033] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f1626] disabled:opacity-70"
          >
            <GoogleMark />
            {redirecting ? "Redirection…" : "Continuer avec Google"}
          </button>
          <p className="mt-3 text-center text-xs text-[#9aa3b1]">
            Réservé aux clients disposant d'une fiche Support Connecté.
          </p>
        </div>
      </div>
    </div>
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

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#fff"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62Z"
      />
      <path
        fill="#fff"
        fillOpacity=".7"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#fff"
        fillOpacity=".85"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.17.29-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z"
      />
      <path
        fill="#fff"
        fillOpacity=".95"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}
