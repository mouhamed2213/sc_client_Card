import { RENEWAL_WHATSAPP_NUMBER } from "@/const";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Layers3,
  LogOut,
  Menu,
  MessageSquare,
  RefreshCw,
  Settings,
  SquareArrowOutUpRight,
  X,
  Sparkles,
} from "lucide-react";
import { ReactNode, useState } from "react";
import { PremiumUpgradeModal } from "@/components/PremiumFeature";
import { Link, useLocation } from "wouter";

export default function ClientLayout({
  children,
  ficheId,
}: {
  children: ReactNode;
  ficheId?: number;
}) {
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState<"Statistiques" | "Demandes reçues" | null>(null);
  const { user, logout } = useAuth();
  const fiches = trpc.clientSpaceRouter.myFiches.useQuery();
  // Single-fiche accounts always have one unambiguous fiche: fall back to it
  // so the fiche-specific menu (Statistiques, Demandes, Modifier) doesn't
  // disappear on pages that don't pass ficheId explicitly (e.g. "Mes fiches").
  // Multi-fiche accounts keep no fallback: outside a fiche's own pages there
  // is no single fiche to point those links at.
  const effectiveFicheId =
    ficheId ?? (fiches.data?.length === 1 ? fiches.data[0].id : undefined);
  const fiche = trpc.clientSpaceRouter.ficheDetail.useQuery(
    { ficheId: effectiveFicheId ?? 0 },
    { enabled: effectiveFicheId !== undefined }
  );

  const currentPlan = fiche.data?.formule;
  const lifecycleBlocked = fiche.data?.statutMetier === "suspendue" || fiche.data?.statutMetier === "expiree";

  const nav = [
    // Aggregated overview of every fiche (only meaningful with several fiches).
    ...((fiches.data?.length ?? 0) > 1
      ? [
          {
            href: "/espace-client",
            label: "Vue d'ensemble",
            icon: LayoutDashboard,
          },
        ]
      : []),
    {
      href: "/espace-client/fiches",
      label: "Mes fiches",
      icon: Layers3,
    },
    ...(effectiveFicheId
      ? [
          {
            href: `/espace-client/fiche/${effectiveFicheId}`,
            label: (fiches.data?.length ?? 0) > 1 ? "Détail de la fiche" : "Vue d'ensemble",
            icon: LayoutDashboard,
          },
          {
            href: `/espace-client/fiche/${effectiveFicheId}/statistiques`,
            label: "Statistiques",
            icon: BarChart3,
            premium: currentPlan !== undefined && currentPlan !== "signature",
            requiredPlan: "signature" as const,
          },
          {
            href: `/espace-client/fiche/${effectiveFicheId}/demandes`,
            label: "Demandes reçues",
            icon: MessageSquare,
            premium: currentPlan !== undefined && currentPlan !== "signature",
            requiredPlan: "signature" as const,
          },
          {
            href: `/espace-client/fiche/${effectiveFicheId}/modifier`,
            label: "Modifier ma fiche",
            icon: Settings,
          },
        ]
      : []),
  ];

  const initials = (user?.name || user?.email || "?")
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2.5 px-1">
        <div className="brand-mark">
          <span className="text-sm font-bold">SC</span>
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">Espace client</p>
          <p className="text-[11px] text-white/45">Support Connecté</p>
        </div>
      </div>

      <div className="mt-6 px-1">
        <p className="eyebrow mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
          Fiche sélectionnée
        </p>

        {ficheId && fiche.data ? (
          <button
            type="button"
            onClick={() => {
              navigate("/espace-client/fiches");
              setOpen(false);
            }}
            className="group w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] text-left transition hover:border-white/20 hover:bg-white/[0.07]"
            aria-label="Ouvrir Mes fiches"
          >
            <div className="relative overflow-hidden px-3.5 py-3.5">
              <div
                className="absolute -right-8 -top-8 h-20 w-20 rounded-full border border-[#e5a86b]/20"
                aria-hidden="true"
              />
              <div className="relative flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e5a86b] text-[11px] font-bold text-[#172033]">
                  {(fiche.data.prenom?.[0] ?? "") + (fiche.data.nom?.[0] ?? "")}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-white">
                    {fiche.data.prenom} {fiche.data.nom}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-white/45">
                    {fiche.data.entreprise}
                  </p>
                </div>
                <CreditCard size={14} className="ml-auto shrink-0 text-[#e5a86b]" />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="rounded-full bg-white/8 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-white/55">
                  {fiche.data.formule}
                </span>
                <span className="text-[9px] font-medium text-white/35">
                  Changer
                </span>
              </div>
            </div>
          </button>
        ) : (
          <div className="rounded-2xl border border-white/8 bg-white/[0.035] px-3.5 py-3.5">
            <p className="text-[11px] leading-5 text-white/45">
              Retrouvez toutes vos fiches dans « Mes fiches ».
            </p>
          </div>
        )}
      </div>

      <nav className="mt-5 flex-1 space-y-1">
        {nav.map(item => {
          const Icon = item.icon;
          const active =
            location === item.href ||
            (item.href === "/espace-client/fiches" &&
              location.startsWith("/espace-client/fiches"));
          return item.premium ? (
              <button
                key={item.href}
                type="button"
                onClick={() => {
                  setPremiumFeature(item.label as "Statistiques" | "Demandes reçues");
                  setOpen(false);
                }}
                className={`sidebar-link w-full ${active ? "sidebar-link-active" : ""}`}
                aria-label={`${item.label}, disponible avec le plan ${item.requiredPlan}`}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                <span className="ml-auto"><PremiumIcon /></span>
              </button>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
        })}
      </nav>

      <div className="mt-6 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2.5 px-1">
          <div className="avatar avatar-small" style={{ background: "#26334a" }}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-white">
              {user?.name || "Mon compte"}
            </p>
            <p className="truncate text-[11px] text-white/45">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="sidebar-link mt-2 w-full"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          <LogOut size={17} />
          Se déconnecter
        </button>
      </div>
    </>
  );

  return (
    <div className="client-shell">
      {currentPlan && (
        <PremiumUpgradeModal
          feature={premiumFeature ?? "Demandes reçues"}
          requiredPlan="signature"
          open={premiumFeature !== null}
          onClose={() => setPremiumFeature(null)}
        />
      )}
      <aside className="client-sidebar hidden lg:flex">{sidebarContent}</aside>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden"
          onClick={() => setOpen(false)}
        >
          <aside
            className="client-sidebar h-full w-72"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-2 flex justify-end">
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
                className="text-white/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="client-main">
        <header className="client-topbar">
          <div className="flex items-center gap-3">
            <button
              className="icon-button lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu size={18} />
            </button>
            <div>
              <p className="text-[15px] font-semibold text-[#172033]">
                {fiche?.data
                  ? `${fiche.data.prenom} ${fiche.data.nom}`
                  : "Bonjour" + (user?.name ? `, ${user.name.split(" ")[0]}` : "")}
              </p>
              {fiche?.data && (
                <p className="text-xs text-[#7d8798]">{fiche.data.entreprise}</p>
              )}
            </div>
          </div>
          {fiche?.data && (
            <div className="hidden items-center gap-2 sm:flex">
              <a
                href={`https://wa.me/${RENEWAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  `Bonjour, je souhaite renouveler ma fiche Support Connecté (${fiche.data.prenom} ${fiche.data.nom} - ${fiche.data.entreprise}).`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e3c89e] bg-[#fff9ef] px-3 py-2 text-sm font-semibold text-[#8b5e20] shadow-sm hover:bg-[#fff4df]"
                aria-label="Renouveler via WhatsApp"
              >
                <RefreshCw size={15} /> Renouveler
              </a>

              {lifecycleBlocked ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6e8ec] bg-[#f6f7f9] px-3 py-2 text-sm font-medium text-[#8a93a2]"
                  aria-label="Fiche publique indisponible"
                >
                  Fiche publique indisponible
                </span>
              ) : (
                <a
                  href={`/fiche/${fiche.data.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6e8ec] px-3 py-2 text-sm font-medium text-[#172033] hover:bg-[#f6f8fa]"
                >
                  <SquareArrowOutUpRight size={15} /> Fiche publique
                </a>
              )}
            </div>
          )}
        </header>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

function PremiumIcon() {
  return <Sparkles size={13} className="text-[#c98a4e]" aria-hidden="true" />;
}
