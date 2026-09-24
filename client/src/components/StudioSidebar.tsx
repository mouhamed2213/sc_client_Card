import { Bell, LayoutDashboard, LayoutGrid, Link2, LogOut, MoreHorizontal, Sparkles, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { ADMIN_HOME_PATH } from "@/const";

export default function StudioSidebar({
  mobileOpen = false,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const [location] = useLocation();
  const overviewQuery = trpc.fiches.overview.useQuery();
  const overview = overviewQuery.data ?? {
    total: 0,
    active: 0,
    scans: 0,
    expiring: 0,
  };
  const utils = trpc.useUtils();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      onClose?.();
      window.location.replace("/admin/login");
    },
    onError: error => {
      toast.error("Déconnexion impossible", { description: error.message });
    },
  });

  const isDashboard = location === ADMIN_HOME_PATH || location === "/studio";
  const isFiches = location.startsWith("/studio/fiches");

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="studio-sidebar-backdrop lg:hidden"
          aria-label="Fermer le menu"
          onClick={onClose}
        />
      )}

      <aside
        id="studio-mobile-navigation"
        className={`studio-sidebar ${mobileOpen ? "studio-sidebar-mobile-open" : "studio-sidebar-mobile-closed"}`}
        aria-label="Navigation du studio"
      >
        <div className="flex items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-3">
            <div className="brand-mark">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">
                Support
              </p>
              <p className="font-semibold tracking-tight text-white">Connecté</p>
            </div>
          </div>

          <button
            type="button"
            className="studio-sidebar-close lg:hidden"
            aria-label="Fermer le menu"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-10 px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">
          Espace studio
        </div>

        <nav className="mt-3 space-y-1" aria-label="Navigation du studio">
          <Link
            className={isDashboard ? "sidebar-link sidebar-link-active" : "sidebar-link"}
            href={ADMIN_HOME_PATH}
            aria-current={isDashboard ? "page" : undefined}
            onClick={onClose}
          >
            <LayoutDashboard className="h-4 w-4" /> Tableau de bord
          </Link>

          <Link
            className={isFiches ? "sidebar-link sidebar-link-active" : "sidebar-link"}
            href="/studio/fiches"
            aria-current={isFiches ? "page" : undefined}
            onClick={onClose}
          >
            <LayoutGrid className="h-4 w-4" /> Fiches clients
            <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
              {overview.total}
            </span>
          </Link>

          <a
            className="sidebar-link"
            href="/studio#liens"
            aria-label="Liens et QR codes"
            onClick={onClose}
          >
            <Link2 className="h-4 w-4" /> Liens & QR
          </a>
        </nav>

        <div className="mt-auto space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-white/55">Ce mois-ci</span>
              <span className="text-xs text-[#e5a86b]">+18%</span>
            </div>
            <p className="text-2xl font-semibold text-white">{overview.scans}</p>
            <p className="mt-1 text-xs text-white/45">passages comptés</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[72%] rounded-full bg-[#e5a86b]" />
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-white/10 pt-4">
            <div className="avatar avatar-small">AD</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">Administrateur</p>
              <p className="truncate text-xs text-white/45">Studio</p>
            </div>
            <MoreHorizontal className="ml-auto h-4 w-4 text-white/45" aria-hidden="true" />
            <Bell className="hidden" aria-hidden="true" />
          </div>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5 text-left text-xs font-medium text-white/65 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4" />
            {logoutMutation.isPending ? "Déconnexion…" : "Se déconnecter"}
          </button>
        </div>
      </aside>
    </>
  );
}
