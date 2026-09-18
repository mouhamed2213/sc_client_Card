import { trpc } from "@/lib/trpc";
import { useActiveOrganization } from "@/contexts/ActiveOrganizationContext";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  SquareArrowOutUpRight,
  Building2,
  X,
} from "lucide-react";
import { ReactNode, useState } from "react";
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
  const { user, logout } = useAuth();
  const { organizations, activeOrganizationId, setActiveOrganizationId } = useActiveOrganization();
  const fiches = trpc.clientSpaceRouter.myFiches.useQuery();
  const fiche = ficheId
    ? trpc.clientSpaceRouter.ficheDetail.useQuery({ ficheId })
    : undefined;

  const nav = ficheId
    ? [
        {
          href: `/espace-client/fiche/${ficheId}`,
          label: "Vue d'ensemble",
          icon: LayoutDashboard,
        },
        {
          href: `/espace-client/fiche/${ficheId}/statistiques`,
          label: "Statistiques",
          icon: BarChart3,
        },
        {
          href: `/espace-client/fiche/${ficheId}/demandes`,
          label: "Demandes reçues",
          icon: MessageSquare,
        },
        {
          href: `/espace-client/fiche/${ficheId}/cartes`,
          label: "Cartes membres",
          icon: CreditCard,
        },
        {
          href: `/espace-client/fiche/${ficheId}/modifier`,
          label: "Modifier ma fiche",
          icon: Settings,
        },
      ]
    : [];

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

      {fiches.data && fiches.data.length > 1 && (
        <div className="mt-6 space-y-1 px-1">
          <p className="eyebrow" style={{ color: "rgba(255,255,255,0.4)" }}>
            Mes fiches
          </p>
          {fiches.data.map(f => (
            <button
              key={f.id}
              onClick={() => {
                navigate(`/espace-client/fiche/${f.id}`);
                setOpen(false);
              }}
              className={`w-full truncate rounded-lg px-3 py-2 text-left text-[13px] transition ${
                f.id === ficheId
                  ? "bg-white/10 font-medium text-white"
                  : "text-white/55 hover:bg-white/5 hover:text-white"
              }`}
            >
              {f.prenom} {f.nom} · {f.entreprise}
            </button>
          ))}
        </div>
      )}

      {organizations && organizations.length > 0 && (
        <div className="mt-5 px-1">
          <label className="eyebrow" style={{ color: "rgba(255,255,255,0.4)" }}>
            Organisation active
          </label>
          <select
            value={activeOrganizationId ?? ""}
            onChange={e => setActiveOrganizationId(Number(e.target.value))}
            className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none"
            aria-label="Organisation active"
          >
            {organizations.map(org => (
              <option key={org.organizationId} value={org.organizationId} className="text-slate-900">
                {org.name} · {org.type}
              </option>
            ))}
          </select>
        </div>
      )}

      <nav className="mt-6 flex-1 space-y-1">
        <Link
          href="/espace-client/organisations"
          onClick={() => setOpen(false)}
          className={`sidebar-link ${location.startsWith("/espace-client/organisation") || location === "/espace-client/organisations" ? "sidebar-link-active" : ""}`}
        >
          <Building2 size={17} />
          Organisations
        </Link>
        {nav.map(item => {
          const Icon = item.icon;
          const active = location === item.href;
          return (
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
            <a
              href={`/fiche/${fiche.data.slug}`}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-lg border border-[#e6e8ec] px-3 py-2 text-sm font-medium text-[#172033] hover:bg-[#f6f8fa] sm:flex"
            >
              <SquareArrowOutUpRight size={15} /> Fiche publique
            </a>
          )}
        </header>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
