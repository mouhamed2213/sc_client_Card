import AdminClientAccountCreationModal from "@/components/AdminClientAccountCreationModal";
import AdminStandaloneFicheCreationModal from "@/components/AdminStandaloneFicheCreationModal";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  ArrowUpRight,
  Bell,
  ChevronDown,
  Copy,
  Eye,
  LayoutDashboard,
  LayoutGrid,
  Link2,
  Menu,
  MoreHorizontal,
  Pencil,
  QrCode as QrCodeIcon,
  Search,
  SlidersHorizontal,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const formulaLabels = {
  essentiel: "Essentiel",
  pro: "Pro",
  signature: "Signature",
  // commerce: "Commerce",
} as const;
const statusLabels = {
  active: "Active",
  a_renouveler: "À renouveler",
  expiree: "Expirée",
  suspendue: "Suspendue",
  supprimee: "Supprimée",
  brouillon: "Brouillon",
} as const;
const statusStyles = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-100",
  a_renouveler: "bg-orange-50 text-orange-700 border-orange-100",
  expiree: "bg-red-50 text-red-700 border-red-100",
  suspendue: "bg-amber-50 text-amber-700 border-amber-100",
  supprimee: "bg-red-50 text-red-700 border-red-100",
  brouillon: "bg-slate-100 text-slate-600 border-slate-200",
} as const;

type Fiche = {
  id: number;
  slug: string;
  formule: keyof typeof formulaLabels;
  statut: Exclude<keyof typeof statusLabels, "a_renouveler">;
  statutMetier: keyof typeof statusLabels;
  nom: string;
  prenom: string;
  fonction: string;
  entreprise: string;
  telephone: string;
  whatsapp: string;
  email?: string | null;
  site?: string | null;
  adresse?: string | null;
  lienItineraire?: string | null;
  googlePlaceId?: string | null;
  dateEcheance: Date | string;
  scansTotal: number;
  lastScanAt?: Date | string | null;
  data: {
    premierBouton?: "whatsapp" | "appel" | "email";
    messageWhatsapp?: string;
    liens?: { label: string; url: string }[];
    horaires?: { jour: string; horaire: string }[];
    galerie?: { url: string; alt: string }[];
    sections?: {
      titre: string;
      articles: { nom: string; description: string; prix: string }[];
    }[];
    notesInternes?: string;
  };
};

function initials(fiche: Fiche) {
  return `${fiche.prenom.slice(0, 1)}${fiche.nom.slice(0, 1)}`.toUpperCase();
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function Home() {
  const fichesQuery = trpc.fiches.recent.useQuery();
  const overviewQuery = trpc.fiches.overview.useQuery();
  const utils = trpc.useUtils();
  const statusMutation = trpc.fiches.updateStatus.useMutation({
    onSuccess: () => {
      utils.fiches.recent.invalidate();
      utils.fiches.overview.invalidate();
      toast.success("Statut mis à jour");
    },
    onError: error =>
      toast.error("Action impossible", { description: error.message }),
  });

  const fiches = (fichesQuery.data ?? []) as Fiche[];
  const overview = overviewQuery.data ?? {
    total: 0,
    active: 0,
    scans: 0,
    expiring: 0,
  };
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | keyof typeof statusLabels>(
    "all"
  );
  const [isClientAccountOpen, setIsClientAccountOpen] = useState(false);
  const [isStandaloneFicheOpen, setIsStandaloneFicheOpen] = useState(false);
  const [qrFiche, setQrFiche] = useState<Fiche | null>(null);

  const filteredFiches = useMemo(
    () =>
      fiches.filter(fiche => {
        const haystack =
          `${fiche.prenom} ${fiche.nom} ${fiche.entreprise} ${fiche.slug}`.toLowerCase();
        return (
          haystack.includes(search.toLowerCase()) &&
          (filter === "all" || fiche.statutMetier === filter)
        );
      }),
    [fiches, filter, search]
  );

  return (
    <div className="studio-shell min-h-screen bg-[#f7f8fa] text-[#172033]">
      <aside className="studio-sidebar hidden lg:flex">
        <div className="flex items-center gap-3 px-2">
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
        <div className="mt-10 px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">
          Espace studio
        </div>
        <nav className="mt-3 space-y-1">
          <Link className="sidebar-link sidebar-link-active" href="/studio">
            <LayoutDashboard className="h-4 w-4" /> Tableau de bord
          </Link>
          <Link className="sidebar-link" href="/studio/fiches">
            <LayoutGrid className="h-4 w-4" /> Fiches clients{" "}
            <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
              {overview.total}
            </span>
          </Link>
          <a className="sidebar-link" href="#liens">
            <Link2 className="h-4 w-4" /> Liens & QR
          </a>
        </nav>
        <div className="mt-auto space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-white/55">Ce mois-ci</span>
              <span className="text-xs text-[#e5a86b]">+18%</span>
            </div>
            <p className="text-2xl font-semibold text-white">
              {overview.scans}
            </p>
            <p className="mt-1 text-xs text-white/45">passages comptés</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[72%] rounded-full bg-[#e5a86b]" />
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-white/10 pt-4">
            <div className="avatar avatar-small">JD</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                Julien Tiget
              </p>
              <p className="truncate text-xs text-white/45">Administrateur</p>
            </div>
            <MoreHorizontal className="ml-auto h-4 w-4 text-white/45" />
          </div>
        </div>
      </aside>

      <main className="studio-main">
        <header className="flex items-center justify-between border-b border-[#e7e9ed] bg-white/80 px-5 py-4 backdrop-blur lg:px-10">
          <div className="flex items-center gap-3">
            <button
              className="icon-button lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="eyebrow">Studio de production</p>
              <h1 className="text-xl font-semibold tracking-[-0.03em] text-[#172033]">
                Fiches clients
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsStandaloneFicheOpen(true)}
              variant="outline"
              className="flex gap-2 border-[#d9dde4]"
            >
              <UserPlus className="h-4 w-4" />
              <span>Nouvelle fiche</span>
            </Button>
            <Button
              onClick={() => setIsClientAccountOpen(true)}
              variant="outline"
              className="hidden gap-2 border-[#d9dde4] sm:flex"
            >
              <UserPlus className="h-4 w-4" />
              Nouveau compte client
            </Button>
            <button
              className="icon-button hidden sm:flex"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="notification-dot" />
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-5 py-8 lg:px-10 lg:py-10">
          <section className="mb-9 grid gap-5 xl:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div className="hero-panel">
              <div className="relative z-10 max-w-lg">
                <p className="eyebrow text-[#e5a86b]">Vue d’ensemble</p>
                <h2 className="mt-3 max-w-md text-3xl font-semibold leading-[1.08] tracking-[-0.045em] text-white sm:text-[40px]">
                  Le bon contenu,
                  <br />
                  <span className="text-[#e5a86b]">au bon endroit.</span>
                </h2>
                <p className="mt-4 max-w-sm text-sm leading-6 text-white/58">
                  Produisez des fiches utiles, rapides à charger et prêtes à
                  être partagées sur une carte NFC.
                </p>
                <a
                  href="studio/fiches"
                  className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-white transition-colors hover:text-[#e5a86b]"
                >
                  Voir les fiches <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
              <div className="hero-orbit orbit-one" />
              <div className="hero-orbit orbit-two" />
              <div className="hero-number">01</div>
            </div>
            <StatCard
              label="Fiches actives"
              value={overview.active}
              note="sur le domaine"
              icon={<Users className="h-4 w-4" />}
              accent="blue"
            />
            <StatCard
              label="Passages comptés"
              value={overview.scans}
              note="depuis le début"
              icon={<Eye className="h-4 w-4" />}
              accent="copper"
            />
            <StatCard
              label="À renouveler"
              value={overview.expiring}
              note="dans les 30 jours"
              icon={<Bell className="h-4 w-4" />}
              accent="amber"
            />
          </section>

          <section
            id="fiches"
            className="rounded-2xl border border-[#e6e8ec] bg-white shadow-[0_12px_32px_rgba(23,32,51,0.04)]"
          >
            <div className="flex flex-col gap-5 border-b border-[#edf0f2] px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-7">
              <div>
                <h2 className="font-semibold tracking-[-0.02em]">
                  Les 10 dernières fiches
                </h2>
                <p className="mt-1 text-sm text-[#7d8798]">
                  Les 10 fiches ou comptes ajoutés le plus récemment.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="search-box">
                  <Search className="h-4 w-4 text-[#9aa3b1]" />
                  <input
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="Rechercher…"
                  />
                </div>
                <button className="filter-button">
                  <SlidersHorizontal className="h-4 w-4" /> Filtrer{" "}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="flex gap-1 overflow-x-auto border-b border-[#edf0f2] px-5 lg:px-7">
              <FilterTab
                label="Toutes"
                active={filter === "all"}
                onClick={() => setFilter("all")}
                count={fiches.length}
              />
              <FilterTab
                label="Actives"
                active={filter === "active"}
                onClick={() => setFilter("active")}
                count={fiches.filter(f => f.statutMetier === "active").length}
              />
              <FilterTab
                label="À renouveler"
                active={filter === "a_renouveler"}
                onClick={() => setFilter("a_renouveler")}
                count={fiches.filter(f => f.statutMetier === "a_renouveler").length}
              />
              <FilterTab
                label="Expirées"
                active={filter === "expiree"}
                onClick={() => setFilter("expiree")}
                count={fiches.filter(f => f.statutMetier === "expiree").length}
              />
              <FilterTab
                label="À revoir"
                active={filter === "brouillon"}
                onClick={() => setFilter("brouillon")}
                count={fiches.filter(f => f.statut === "brouillon").length}
              />
              <FilterTab
                label="Suspendues"
                active={filter === "suspendue"}
                onClick={() => setFilter("suspendue")}
                count={fiches.filter(f => f.statut === "suspendue").length}
              />
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#edf0f2] text-left text-[11px] uppercase tracking-[0.13em] text-[#99a1ad]">
                    <th className="px-7 py-4 font-semibold">Client</th>
                    <th className="px-4 py-4 font-semibold">Formule</th>
                    <th className="px-4 py-4 font-semibold">Statut</th>
                    <th className="px-4 py-4 font-semibold">Passages</th>
                    <th className="px-4 py-4 font-semibold">Échéance</th>
                    <th className="px-7 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiches.map(fiche => (
                    <FicheRow
                      key={fiche.id}
                      fiche={fiche}
                      onQr={() => setQrFiche(fiche)}
                      onSuspend={() =>
                        statusMutation.mutate({
                          id: fiche.id,
                          statut:
                            fiche.statut === "suspendue"
                              ? "active"
                              : "suspendue",
                        })
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 p-4 md:hidden">
              {filteredFiches.map(fiche => (
                <FicheCard
                  key={fiche.id}
                  fiche={fiche}
                  onQr={() => setQrFiche(fiche)}
                  onSuspend={() =>
                    statusMutation.mutate({
                      id: fiche.id,
                      statut:
                        fiche.statut === "suspendue" ? "active" : "suspendue",
                    })
                  }
                />
              ))}
            </div>
            {!filteredFiches.length && (
              <div className="px-7 py-14 text-center text-sm text-[#7d8798]">
                Aucune fiche ne correspond à cette recherche.
              </div>
            )}
            <div className="flex items-center justify-between border-t border-[#edf0f2] px-5 py-4 text-xs text-[#8b94a3] lg:px-7">
              <span>
                {filteredFiches.length} fiche
                {filteredFiches.length > 1 ? "s" : ""} affichée
                {filteredFiches.length > 1 ? "s" : ""}
              </span>
              <span className="hidden sm:inline">
                Dernière synchronisation il y a quelques secondes
              </span>
            </div>
          </section>

          <section
            className="mt-7 rounded-2xl border border-[#e6e8ec] bg-[#fffaf4] p-6"
          >
            <p className="eyebrow text-[#b27945]">Raccourci utile</p>
            <h2 className="mt-2 text-lg font-semibold tracking-[-0.025em]">
              Message de collecte
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#7d6552]">
              Les huit éléments à demander au client, prêts à copier-coller
              sur WhatsApp.
            </p>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(
                  "Bonjour, merci pour votre confiance. Pour préparer votre fiche, j'ai besoin de votre nom exact, fonction, établissement, photo ou logo, numéros, adresse, liens et horaires."
                );
                toast.success("Message copié");
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#172033] px-4 py-3 text-sm font-semibold text-white hover:bg-[#27334a]"
            >
              <Copy className="h-4 w-4" /> Copier le message
            </button>
          </section>

        </div>
      </main>

      {qrFiche && <QrModal fiche={qrFiche} onClose={() => setQrFiche(null)} />}
      <AdminClientAccountCreationModal
        open={isClientAccountOpen}
        onClose={() => setIsClientAccountOpen(false)}
      />
      <AdminStandaloneFicheCreationModal
        open={isStandaloneFicheOpen}
        onClose={() => setIsStandaloneFicheOpen(false)}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
  icon,
  accent,
}: {
  label: string;
  value: number;
  note: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon stat-icon-${accent}`}>{icon}</div>
      <p className="mt-7 text-sm text-[#7d8798]">{label}</p>
      <div className="mt-1 flex items-end gap-2">
        <span className="text-3xl font-semibold tracking-[-0.05em]">
          {value}
        </span>
        <span className="mb-1 text-xs text-[#a0a8b4]">{note}</span>
      </div>
      <div className="mt-7 h-1 rounded-full bg-[#f0f2f5]">
        <div
          className={`h-full rounded-full ${accent === "copper" ? "w-[68%] bg-[#e5a86b]" : accent === "amber" ? "w-[35%] bg-[#d6a15d]" : "w-[82%] bg-[#5d8fdc]"}`}
        />
      </div>
    </div>
  );
}

function FilterTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`tab-button ${active ? "tab-button-active" : ""}`}
    >
      {label}
      <span className={active ? "tab-count-active" : "tab-count"}>{count}</span>
    </button>
  );
}
function FicheIdentity({ fiche }: { fiche: Fiche }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`avatar ${fiche.formule === "signature" ? "avatar-copper" : ""}`}
      >
        {initials(fiche)}
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold text-[#29344a]">
          {fiche.prenom} {fiche.nom}
        </p>
        <p className="truncate text-xs text-[#8b94a3]">{fiche.entreprise}</p>
      </div>
    </div>
  );
}
function FicheRow({
  fiche,
  onQr,
  onSuspend,
}: {
  fiche: Fiche;
  onQr: () => void;
  onSuspend: () => void;
}) {
  return (
    <tr className="border-b border-[#f0f2f4] transition-colors last:border-0 hover:bg-[#fcfcfd]">
      <td className="px-7 py-4">
        <Link href={`/studio/fiche/${fiche.slug}`}>
          <FicheIdentity fiche={fiche} />
        </Link>
      </td>
      <td className="px-4 py-4">
        <span className="text-sm text-[#657084]">
          {formulaLabels[fiche.formule]}
        </span>
      </td>
      <td className="px-4 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[fiche.statutMetier]}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {statusLabels[fiche.statutMetier]}
        </span>
      </td>
      <td className="px-4 py-4 text-sm font-medium text-[#42506a]">
        {fiche.scansTotal}
      </td>
      <td className="px-4 py-4 text-sm text-[#657084]">
        {formatDate(fiche.dateEcheance)}
      </td>
      <td className="px-7 py-4 text-right">
        <div className="flex justify-end gap-1">
          <Link
            href={`/studio/fiche/${fiche.slug}`}
            className="table-action"
            title="Modifier"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <Link
            href={`/fiche/${fiche.slug}`}
            className="table-action"
            title="Prévisualiser"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button
            onClick={onQr}
            className="table-action"
            title="Afficher le QR code"
          >
            <QrCodeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onSuspend}
            className="table-action"
            title={fiche.statut === "suspendue" ? "Réactiver" : "Suspendre"}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
function FicheCard({
  fiche,
  onQr,
  onSuspend,
}: {
  fiche: Fiche;
  onQr: () => void;
  onSuspend: () => void;
}) {
  return (
    <div className="rounded-xl border border-[#edf0f2] p-4">
      <div className="flex items-start justify-between">
        <FicheIdentity fiche={fiche} />
        <span
          className={`rounded-full border px-2 py-1 text-[10px] font-medium ${statusStyles[fiche.statutMetier]}`}
        >
          {statusLabels[fiche.statutMetier]}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <div>
          <p className="text-[#9aa3b1]">Formule</p>
          <p className="mt-1 font-medium">{formulaLabels[fiche.formule]}</p>
        </div>
        <div>
          <p className="text-[#9aa3b1]">Passages</p>
          <p className="mt-1 font-medium">{fiche.scansTotal}</p>
        </div>
        <div>
          <p className="text-[#9aa3b1]">Échéance</p>
          <p className="mt-1 font-medium">{formatDate(fiche.dateEcheance)}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Link
          href={`/studio/fiche/${fiche.slug}`}
          className="flex-1 rounded-lg bg-[#172033] py-2 text-center text-xs font-semibold text-white"
        >
          Modifier
        </Link>
        <Link
          href={`/fiche/${fiche.slug}`}
          className="rounded-lg border border-[#e6e8ec] px-3 py-2"
          title="Prévisualiser"
        >
          <Eye className="h-4 w-4" />
        </Link>
        <button
          onClick={onQr}
          className="rounded-lg border border-[#e6e8ec] px-3 py-2 text-xs font-semibold"
          title="Afficher le QR code"
        >
          <QrCodeIcon className="h-4 w-4" />
        </button>
        <button
          onClick={onSuspend}
          className="rounded-lg border border-[#e6e8ec] px-3 py-2 text-xs font-semibold"
        >
          {fiche.statut === "suspendue" ? "Réactiver" : "Suspendre"}
        </button>
      </div>
    </div>
  );
}

function QrModal({ fiche, onClose }: { fiche: Fiche; onClose: () => void }) {
  const publicUrl = `${window.location.origin}/fiche/${fiche.slug}`;
  function downloadQr() {
    const svg = document.getElementById(`qr-${fiche.slug}`);
    if (!svg) return;
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fiche.slug}-qrcode.svg`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("QR code téléchargé");
  }
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="qr-panel">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">QR code de la fiche</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
              {fiche.prenom} {fiche.nom}
            </h2>
            <p className="mt-1 text-sm text-[#7d8798]">
              À imprimer sur la carte ou à partager directement.
            </p>
          </div>
          <button onClick={onClose} className="icon-button">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="qr-preview">
          <QRCodeSVG
            id={`qr-${fiche.slug}`}
            value={publicUrl}
            size={224}
            bgColor="#ffffff"
            fgColor="#172033"
            level="M"
            includeMargin
          />
        </div>
        <div className="qr-url">
          <QrCodeIcon className="h-4 w-4 flex-shrink-0 text-[#7d8798]" />
          <span>{publicUrl}</span>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button
            onClick={downloadQr}
            className="gap-2 bg-[#172033] text-white hover:bg-[#27334a]"
          >
            <QrCodeIcon className="h-4 w-4" /> Télécharger le QR
          </Button>
        </div>
      </div>
    </div>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-[#7d8798]">
        {label}
      </span>
      {children}
    </label>
  );
}
