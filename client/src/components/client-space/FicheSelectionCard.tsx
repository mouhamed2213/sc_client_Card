import {
  ArrowUpRight,
  Building2,
  Check,
  Clock3,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useLocation } from "wouter";
import { formuleLabels, getEcheanceStatus } from "@/lib/ficheStatus";

type FicheCardData = {
  id: number;
  slug: string;
  nom: string;
  prenom: string;
  entreprise: string;
  fonction: string;
  formule: string;
  statut: string;
  dateEcheance: string | Date;
};

const PLAN_STYLE: Record<
  string,
  {
    label: string;
    accent: string;
    soft: string;
    glow: string;
    badge: string;
    icon: typeof Sparkles;
  }
> = {
  essentiel: {
    label: "Essentiel",
    accent: "#8b97ab",
    soft: "#f1f4f7",
    glow: "rgba(139,151,171,0.22)",
    badge: "bg-[#eef2f6] text-[#52607a]",
    icon: Building2,
  },
  pro: {
    label: "Pro",
    accent: "#6d91c0",
    soft: "#edf4ff",
    glow: "rgba(109,145,192,0.24)",
    badge: "bg-[#edf4ff] text-[#3f6695]",
    icon: Sparkles,
  },
  signature: {
    label: "Signature",
    accent: "#d69a5d",
    soft: "#fff3e7",
    glow: "rgba(214,154,93,0.26)",
    badge: "bg-[#fff3e7] text-[#9a622d]",
    icon: Sparkles,
  },
};

export default function FicheSelectionCard({
  fiche,
  selected = false,
}: {
  fiche: FicheCardData;
  selected?: boolean;
}) {
  const [, navigate] = useLocation();
  const plan = PLAN_STYLE[fiche.formule] ?? PLAN_STYLE.essentiel;
  const echeance = getEcheanceStatus(fiche.dateEcheance);
  const initials = `${fiche.prenom?.[0] ?? ""}${fiche.nom?.[0] ?? ""}`.toUpperCase() || "?";
  const PlanIcon = plan.icon;
  const active = fiche.statut === "active";

  return (
    <article
      className="group relative overflow-hidden rounded-[24px] border bg-white shadow-[0_14px_38px_rgba(23,32,51,0.055)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(23,32,51,0.11)]"
      style={{
        borderColor: selected ? plan.accent : "#e6e8ec",
        boxShadow: selected
          ? `0 0 0 1px ${plan.accent}, 0 20px 50px ${plan.glow}`
          : undefined,
      }}
    >
      <div
        className="relative min-h-[188px] overflow-hidden p-5 text-white"
        style={{
          background: `radial-gradient(circle at 88% 12%, ${plan.glow}, transparent 34%), linear-gradient(145deg, #1e293b 0%, #172033 62%, #101827 100%)`,
        }}
      >
        <div
          className="absolute -right-12 -top-16 h-40 w-40 rounded-full border"
          style={{ borderColor: `${plan.accent}55` }}
          aria-hidden="true"
        />
        <div
          className="absolute -right-3 -top-7 h-24 w-24 rounded-full border border-white/10"
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold shadow-lg"
              style={{ background: plan.accent, color: "#172033" }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                Support Connecté
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-white">
                {fiche.entreprise || "Ma fiche"}
              </p>
            </div>
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${plan.badge}`}>
            <PlanIcon size={11} />
            {formuleLabels[fiche.formule] ?? plan.label}
          </span>
        </div>

        <div className="relative z-10 mt-8">
          <p className="truncate text-[25px] font-bold tracking-[-0.035em]">
            {fiche.prenom} {fiche.nom}
          </p>
          <p className="mt-1 truncate text-xs text-white/55">
            {fiche.fonction || "Fiche professionnelle"}
          </p>
        </div>

        <div className="relative z-10 mt-5 flex items-end justify-between gap-3">
          <span className="truncate font-mono text-[10px] tracking-[0.08em] text-white/40">
            /fiche/{fiche.slug}
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold"
            style={{
              borderColor: active ? "rgba(110,231,183,.22)" : "rgba(255,255,255,.12)",
              background: active ? "rgba(16,185,129,.12)" : "rgba(255,255,255,.06)",
              color: active ? "#a7f3d0" : "rgba(255,255,255,.62)",
            }}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-300" : "bg-white/35"}`} />
            {active ? "Active" : fiche.statut}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-2">
          <div className={`rounded-xl border px-3 py-2.5 ${plan.soft}`} style={{ borderColor: `${plan.accent}22` }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8b95a5]">
              Formule
            </p>
            <p className="mt-1 text-xs font-semibold text-[#26344a]">
              {formuleLabels[fiche.formule] ?? fiche.formule}
            </p>
          </div>
          <div className="rounded-xl border border-[#edf0f2] bg-[#fafbfc] px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8b95a5]">
              Échéance
            </p>
            <p className={`mt-1 truncate text-xs font-semibold ${echeance.pillClass === "status-pill-danger" ? "text-[#a3392f]" : echeance.pillClass === "status-pill-warn" ? "text-[#9a5c10]" : "text-[#216a48]"}`}>
              {echeance.label}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5 text-xs text-[#8a94a5]">
            <Clock3 size={13} />
            <span className="truncate">
              Jusqu'au{" "}
              {new Date(fiche.dateEcheance).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
          </div>
          {selected && (
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-[#216a48]">
              <Check size={13} /> Sélectionnée
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate(`/espace-client/fiche/${fiche.id}`)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105 active:scale-[0.99]"
          style={{ background: plan.accent }}
        >
          Voir la fiche
          <ArrowUpRight size={16} />
        </button>

        <a
          href={`/fiche/${fiche.slug}?preview=1`}
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#667085] transition hover:bg-[#f5f7f9] hover:text-[#26344a]"
        >
          <ExternalLink size={13} />
          Voir la fiche publique
        </a>
      </div>
    </article>
  );
}
