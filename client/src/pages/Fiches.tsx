import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ADMIN_HOME_PATH } from "@/const";
import {
  Bell,
  Eye,
  LayoutDashboard,
  Menu,
  Pencil,
  QrCode as QrCodeIcon,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

const formulaLabels = {
  essentiel: "Essentiel",
  pro: "Pro",
  signature: "Signature",
} as const;

const statusLabels = {
  active: "Active",
  suspendue: "Suspendue",
  supprimee: "Supprimée",
  brouillon: "Brouillon",
} as const;

const statusStyles = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-100",
  suspendue: "bg-amber-50 text-amber-700 border-amber-100",
  supprimee: "bg-red-50 text-red-700 border-red-100",
  brouillon: "bg-slate-100 text-slate-600 border-slate-200",
} as const;

type Fiche = {
  id: number;
  slug: string;
  formule: keyof typeof formulaLabels;
  statut: keyof typeof statusLabels;
  nom: string;
  prenom: string;
  fonction: string;
  entreprise: string;
  dateEcheance: Date | string;
  scansTotal: number;
};

type StatusFilter = "all" | keyof typeof statusLabels;

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

export default function Fiches() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [qrFiche, setQrFiche] = useState<Fiche | null>(null);

  // Même procédure que le dashboard : on réutilise la liste canonique des fiches.
  const listQuery = trpc.fiches.list.useQuery();

  const utils = trpc.useUtils();
  const statusMutation = trpc.fiches.updateStatus.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.fiches.list.invalidate(),
        utils.fiches.overview.invalidate(),
      ]);
      toast.success("Statut mis à jour");
    },
    onError: error =>
      toast.error("Action impossible", { description: error.message }),
  });

  const fiches = (listQuery.data ?? []) as Fiche[];

  const rows = useMemo(
    () =>
      fiches.filter(fiche => {
        const haystack =
          `${fiche.prenom} ${fiche.nom} ${fiche.entreprise} ${fiche.slug}`.toLowerCase();

        return (
          haystack.includes(search.trim().toLowerCase()) &&
          (filter === "all" || fiche.statut === filter)
        );
      }),
    [fiches, filter, search]
  );

  const total = fiches.length;
  const counts = {
    all: total,
  };

  function changeFilter(next: StatusFilter) {
    setFilter(next);
  }

  function changeSearch(value: string) {
    setSearch(value);
  }

  function toggleStatus(fiche: Fiche) {
    if (fiche.statut !== "active" && fiche.statut !== "suspendue") return;
    statusMutation.mutate({
      id: fiche.id,
      statut: fiche.statut === "suspendue" ? "active" : "suspendue",
    });
  }

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

        <nav className="mt-3 space-y-1" aria-label="Navigation du studio">
          <Link className="sidebar-link" href={ADMIN_HOME_PATH}>
            <LayoutDashboard className="h-4 w-4" /> Tableau de bord
          </Link>
          <Link className="sidebar-link sidebar-link-active" href="/studio/fiches">
            <Pencil className="h-4 w-4" /> Fiches clients
            <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
              {counts.all}
            </span>
          </Link>
        </nav>

        <div className="mt-auto">
          <div className="flex items-center gap-3 border-t border-white/10 pt-4">
            <div className="avatar avatar-small">AD</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">Administrateur</p>
              <p className="truncate text-xs text-white/45">Studio</p>
            </div>
            <Bell className="ml-auto h-4 w-4 text-white/45" aria-hidden="true" />
          </div>
        </div>
      </aside>

      <main className="studio-main">
        <header className="flex items-center justify-between border-b border-[#e7e9ed] bg-white/80 px-5 py-4 backdrop-blur lg:px-10">
          <div className="flex items-center gap-3">
            <button className="icon-button lg:hidden" aria-label="Ouvrir le menu">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="eyebrow">Studio de production</p>
              <h1 className="text-xl font-semibold tracking-[-0.03em]">
                Fiches clients
              </h1>
            </div>
          </div>
          <Link href={ADMIN_HOME_PATH} className="hidden text-sm font-medium text-[#526078] hover:text-[#172033] sm:block">
            Retour au tableau de bord
          </Link>
        </header>

        <div className="mx-auto max-w-[1440px] px-5 py-8 lg:px-10 lg:py-10">
          <div className="mb-7">
            <p className="eyebrow">Gestion</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              Toutes les fiches
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7d8798]">
              Recherchez, filtrez et accédez rapidement à l'édition, à la fiche publique ou au QR code.
            </p>
          </div>

          <section className="rounded-2xl border border-[#e6e8ec] bg-white shadow-[0_12px_32px_rgba(23,32,51,0.04)]">
            <div className="flex flex-col gap-4 border-b border-[#edf0f2] px-5 py-5 lg:px-7">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="search-box w-full md:max-w-md">
                  <Search className="h-4 w-4 text-[#9aa3b1]" aria-hidden="true" />
                  <input
                    value={search}
                    onChange={event => changeSearch(event.target.value)}
                    placeholder="Rechercher un nom, une entreprise ou un slug…"
                    aria-label="Rechercher une fiche"
                  />
                </div>
                <span className="text-xs text-[#8b94a3]">
                  {total} fiche{total > 1 ? "s" : ""} au total
                </span>
              </div>

              <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Filtrer les fiches">
                <FilterTab label="Toutes" active={filter === "all"} onClick={() => changeFilter("all")} />
                <FilterTab label="Actives" active={filter === "active"} onClick={() => changeFilter("active")} />
                <FilterTab label="À revoir" active={filter === "brouillon"} onClick={() => changeFilter("brouillon")} />
                <FilterTab label="Suspendues" active={filter === "suspendue"} onClick={() => changeFilter("suspendue")} />
                <FilterTab label="Supprimées" active={filter === "supprimee"} onClick={() => changeFilter("supprimee")} />
              </div>
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
                    <th className="px-7 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(fiche => (
                    <FicheRow
                      key={fiche.id}
                      fiche={fiche}
                      busy={statusMutation.isPending && statusMutation.variables?.id === fiche.id}
                      onQr={() => setQrFiche(fiche)}
                      onStatus={() => toggleStatus(fiche)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {rows.map(fiche => (
                <FicheCard
                  key={fiche.id}
                  fiche={fiche}
                  busy={statusMutation.isPending && statusMutation.variables?.id === fiche.id}
                  onQr={() => setQrFiche(fiche)}
                  onStatus={() => toggleStatus(fiche)}
                />
              ))}
            </div>

            {!listQuery.isLoading && !rows.length && (
              <div className="px-7 py-14 text-center text-sm text-[#7d8798]">
                Aucune fiche ne correspond à cette recherche.
              </div>
            )}

            {listQuery.isLoading && (
              <div className="px-7 py-14 text-center text-sm text-[#7d8798]">
                Chargement des fiches…
              </div>
            )}

            <div className="border-t border-[#edf0f2] px-5 py-4 text-xs text-[#8b94a3] lg:px-7">
              {rows.length} fiche{rows.length > 1 ? "s" : ""} affichée{rows.length > 1 ? "s" : ""}
            </div>
          </section>
        </div>
      </main>

      {qrFiche && <QrModal fiche={qrFiche} onClose={() => setQrFiche(null)} />}
    </div>
  );
}

function FilterTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`tab-button whitespace-nowrap ${active ? "tab-button-active" : ""}`}
    >
      {label}
    </button>
  );
}

function FicheIdentity({ fiche }: { fiche: Fiche }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`avatar ${fiche.formule === "signature" ? "avatar-copper" : ""}`}>
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
  busy,
  onQr,
  onStatus,
}: {
  fiche: Fiche;
  busy: boolean;
  onQr: () => void;
  onStatus: () => void;
}) {
  const canToggle = fiche.statut === "active" || fiche.statut === "suspendue";

  return (
    <tr className="border-b border-[#f0f2f4] transition-colors last:border-0 hover:bg-[#fcfcfd]">
      <td className="px-7 py-4">
        <Link href={`/studio/fiche/${fiche.slug}`}>
          <FicheIdentity fiche={fiche} />
        </Link>
      </td>
      <td className="px-4 py-4 text-sm text-[#657084]">{formulaLabels[fiche.formule]}</td>
      <td className="px-4 py-4">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[fiche.statut]}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {statusLabels[fiche.statut]}
        </span>
      </td>
      <td className="px-4 py-4 text-sm font-medium text-[#42506a]">{fiche.scansTotal}</td>
      <td className="px-4 py-4 text-sm text-[#657084]">{formatDate(fiche.dateEcheance)}</td>
      <td className="px-7 py-4 text-right">
        <div className="flex justify-end gap-1">
          <Link href={`/studio/fiche/${fiche.slug}`} className="table-action" title="Ouvrir dans le studio" aria-label={`Modifier ${fiche.prenom} ${fiche.nom}`}>
            <Pencil className="h-4 w-4" />
          </Link>
          <Link href={`/fiche/${fiche.slug}`} className="table-action" title="Voir la fiche publique" aria-label={`Voir ${fiche.prenom} ${fiche.nom}`}>
            <Eye className="h-4 w-4" />
          </Link>
          <button type="button" onClick={onQr} className="table-action" title="Afficher le QR code" aria-label={`QR code de ${fiche.prenom} ${fiche.nom}`}>
            <QrCodeIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onStatus}
            disabled={!canToggle || busy}
            className="table-action disabled:cursor-not-allowed disabled:opacity-40"
            title={canToggle ? (fiche.statut === "suspendue" ? "Réactiver" : "Suspendre") : "Action indisponible pour ce statut"}
            aria-label={canToggle ? (fiche.statut === "suspendue" ? "Réactiver" : "Suspendre") : "Action indisponible"}
          >
            {fiche.statut === "suspendue" ? "↻" : "⏸"}
          </button>
        </div>
      </td>
    </tr>
  );
}

function FicheCard({
  fiche,
  busy,
  onQr,
  onStatus,
}: {
  fiche: Fiche;
  busy: boolean;
  onQr: () => void;
  onStatus: () => void;
}) {
  const canToggle = fiche.statut === "active" || fiche.statut === "suspendue";

  return (
    <div className="rounded-xl border border-[#edf0f2] p-4">
      <div className="flex items-start justify-between gap-3">
        <FicheIdentity fiche={fiche} />
        <span className={`rounded-full border px-2 py-1 text-[10px] font-medium ${statusStyles[fiche.statut]}`}>
          {statusLabels[fiche.statut]}
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

      <div className="mt-4 grid grid-cols-4 gap-2">
        <Link href={`/studio/fiche/${fiche.slug}`} className="rounded-lg bg-[#172033] py-2 text-center text-xs font-semibold text-white" title="Ouvrir dans le studio">
          <Pencil className="mx-auto h-4 w-4" />
          <span className="sr-only">Studio</span>
        </Link>
        <Link href={`/fiche/${fiche.slug}`} className="rounded-lg border border-[#e6e8ec] py-2 text-center" title="Voir la fiche">
          <Eye className="mx-auto h-4 w-4" />
          <span className="sr-only">Voir</span>
        </Link>
        <button type="button" onClick={onQr} className="rounded-lg border border-[#e6e8ec] py-2" title="Afficher le QR code">
          <QrCodeIcon className="mx-auto h-4 w-4" />
          <span className="sr-only">QR code</span>
        </button>
        <button type="button" onClick={onStatus} disabled={!canToggle || busy} className="rounded-lg border border-[#e6e8ec] py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40" title={canToggle ? (fiche.statut === "suspendue" ? "Réactiver" : "Suspendre") : "Action indisponible"}>
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
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="fiche-qr-title">
      <div className="qr-panel">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">QR code de la fiche</p>
            <h2 id="fiche-qr-title" className="mt-1 text-xl font-semibold tracking-[-0.03em]">
              {fiche.prenom} {fiche.nom}
            </h2>
            <p className="mt-1 text-sm text-[#7d8798]">
              À imprimer sur la carte ou à partager directement.
            </p>
          </div>
          <button type="button" onClick={onClose} className="icon-button" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="qr-preview">
          <QRCodeSVG id={`qr-${fiche.slug}`} value={publicUrl} size={224} bgColor="#ffffff" fgColor="#172033" level="M" includeMargin />
        </div>

        <div className="qr-url">
          <QrCodeIcon className="h-4 w-4 flex-shrink-0 text-[#7d8798]" />
          <span>{publicUrl}</span>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
          <Button onClick={downloadQr} className="gap-2 bg-[#172033] text-white hover:bg-[#27334a]">
            <QrCodeIcon className="h-4 w-4" /> Télécharger le QR
          </Button>
        </div>
      </div>
    </div>
  );
}
