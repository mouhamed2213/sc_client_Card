import StudioSidebar from "@/components/StudioSidebar";
import { Button } from "@/components/ui/button";
import { ADMIN_HOME_PATH } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  ChevronDown,
  Eye,
  Menu,
  Pencil,
  QrCode as QrCodeIcon,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const formulaLabels = {
  essentiel: "Essentiel",
  pro: "Pro",
  signature: "Signature",
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
  dateEcheance: Date | string;
  scansTotal: number;
  owner?: { id: number; name: string | null; email: string | null } | null;
};

type ClientUser = { id: number; name: string | null; email: string | null; _count: { fiche: number }; fiche: Array<{ id:number; slug:string; formule:keyof typeof formulaLabels; statut:string; prenom:string; nom:string; entreprise:string; scansTotal:number }> };

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
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [qrFiche, setQrFiche] = useState<Fiche | null>(null);
  const [viewMode, setViewMode] = useState<"users" | "fiches">("users");
  const pageSize = 10;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const usersQuery = trpc.fiches.usersPaginated.useQuery({ page, pageSize, search: debouncedSearch }, { enabled: viewMode === "users" });

  const listQuery = trpc.fiches.listPaginated.useQuery({
    page,
    pageSize,
    search: debouncedSearch,
    ...(filter === "all" ? {} : { statut: filter }),
  });

  const utils = trpc.useUtils();
  const statusMutation = trpc.fiches.updateStatus.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.fiches.listPaginated.invalidate(),
        utils.fiches.list.invalidate(),
        utils.fiches.overview.invalidate(),
      ]);
      toast.success("Statut mis à jour");
    },
    onError: error =>
      toast.error("Action impossible", { description: error.message }),
  });

  const rows = (listQuery.data?.rows ?? []) as Fiche[];
  const users = (usersQuery.data?.rows ?? []) as ClientUser[];
  const total = viewMode === "users" ? usersQuery.data?.total ?? 0 : listQuery.data?.total ?? 0;
  const isLoading = viewMode === "users" ? usersQuery.isLoading : listQuery.isLoading;
  const isFetching = viewMode === "users" ? usersQuery.isFetching : listQuery.isFetching;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);
  const counts = {
    all: total,
  };

  function changeFilter(next: StatusFilter) {
    setFilter(next);
    setPage(1);
  }

  function changeSearch(value: string) {
    setSearch(value);
  }

  function changePage(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
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
      <StudioSidebar />
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
              <h1 className="text-xl font-semibold tracking-[-0.03em]">
                Fiches clients
              </h1>
            </div>
          </div>
          <Link
            href={ADMIN_HOME_PATH}
            className="hidden text-sm font-medium text-[#526078] hover:text-[#172033] sm:block"
          >
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
              Recherchez, filtrez et accédez rapidement à l'édition, à la fiche
              publique ou au QR code.
            </p>
          </div>

          <section className="rounded-2xl border border-[#e6e8ec] bg-white shadow-[0_12px_32px_rgba(23,32,51,0.04)]">
            <div className="flex flex-col gap-4 border-b border-[#edf0f2] px-5 py-5 lg:px-7">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="search-box w-full md:max-w-md">
                  <Search
                    className="h-4 w-4 text-[#9aa3b1]"
                    aria-hidden="true"
                  />
                  <input
                    value={search}
                    onChange={event => changeSearch(event.target.value)}
                    placeholder="Rechercher un nom, une entreprise ou un slug…"
                    aria-label="Rechercher une fiche"
                  />
                </div>
                <span className="text-xs text-[#8b94a3]">
                  {total} {viewMode === "users" ? "client" + (total > 1 ? "s" : "") : "fiche" + (total > 1 ? "s" : "")} au total
                </span>
              </div>

              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Mode d'affichage"><button type="button" role="tab" aria-selected={viewMode === "users"} onClick={() => {setViewMode("users");setPage(1);}} className={`tab-button ${viewMode === "users" ? "tab-button-active" : ""}`}><UserRound className="mr-1 inline h-4 w-4"/>Utilisateurs</button><button type="button" role="tab" aria-selected={viewMode === "fiches"} onClick={() => {setViewMode("fiches");setPage(1);}} className={`tab-button ${viewMode === "fiches" ? "tab-button-active" : ""}`}>Toutes les fiches</button></div>
              {viewMode === "fiches" && (<div
                className="flex gap-1 overflow-x-auto"
                role="tablist"
                aria-label="Filtrer les fiches"
              >
                <FilterTab
                  label="Toutes"
                  active={filter === "all"}
                  onClick={() => changeFilter("all")}
                />
                <FilterTab
                  label="Actives"
                  active={filter === "active"}
                  onClick={() => changeFilter("active")}
                />
                <FilterTab
                  label="À renouveler"
                  active={filter === "a_renouveler"}
                  onClick={() => changeFilter("a_renouveler")}
                />
                <FilterTab
                  label="Expirées"
                  active={filter === "expiree"}
                  onClick={() => changeFilter("expiree")}
                />
                <FilterTab
                  label="À revoir"
                  active={filter === "brouillon"}
                  onClick={() => changeFilter("brouillon")}
                />
                <FilterTab
                  label="Suspendues"
                  active={filter === "suspendue"}
                  onClick={() => changeFilter("suspendue")}
                />
                <FilterTab
                  label="Supprimées"
                  active={filter === "supprimee"}
                  onClick={() => changeFilter("supprimee")}
                />
              </div>)}
            </div>

            {viewMode === "users" ? <UsersTable users={users} /> : <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#edf0f2] text-left text-[11px] uppercase tracking-[0.13em] text-[#99a1ad]">
                    <th className="px-7 py-4 font-semibold">Client</th>
                    <th className="px-4 py-4 font-semibold">Formule</th>
                    <th className="px-4 py-4 font-semibold">Statut</th>
                    <th className="px-4 py-4 font-semibold">Passages</th>
                    <th className="px-4 py-4 font-semibold">Compte rattaché</th>
                    <th className="px-4 py-4 font-semibold">Échéance</th>
                    <th className="px-7 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(fiche => (
                    <FicheRow
                      key={fiche.id}
                      fiche={fiche}
                      busy={
                        statusMutation.isPending &&
                        statusMutation.variables?.id === fiche.id
                      }
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
                  busy={
                    statusMutation.isPending &&
                    statusMutation.variables?.id === fiche.id
                  }
                  onQr={() => setQrFiche(fiche)}
                  onStatus={() => toggleStatus(fiche)}
                />
              ))}
            </div>

            </>}

            {!isLoading && !isFetching && (viewMode === "users" ? !users.length : !rows.length) && (
              <div className="px-7 py-14 text-center text-sm text-[#7d8798]">
                Aucune fiche ne correspond à cette recherche.
              </div>
            )}

            {isLoading && (
              <div className="px-7 py-14 text-center text-sm text-[#7d8798]">
                Chargement des fiches…
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-[#edf0f2] px-5 py-4 text-xs text-[#8b94a3] sm:flex-row sm:items-center sm:justify-between lg:px-7">
              <span>
                {startItem}–{endItem} sur {total} fiche{total > 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-1" aria-label="Pagination">
                <button
                  type="button"
                  onClick={() => changePage(page - 1)}
                  disabled={page === 1 || isFetching}
                  className="rounded-lg border border-[#e6e8ec] px-3 py-2 font-medium text-[#526078] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Précédent
                </button>
                <span className="min-w-20 text-center">
                  Page {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => changePage(page + 1)}
                  disabled={page >= totalPages || isFetching}
                  className="rounded-lg border border-[#e6e8ec] px-3 py-2 font-medium text-[#526078] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Suivante
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {qrFiche && <QrModal fiche={qrFiche} onClose={() => setQrFiche(null)} />}
    </div>
  );
}


function UsersTable({ users }: { users: ClientUser[] }) { return <div className="hidden overflow-x-auto md:block"><table className="w-full"><thead><tr className="border-b border-[#edf0f2] text-left text-[11px] uppercase tracking-[0.13em] text-[#99a1ad]"><th className="px-7 py-4 font-semibold">Utilisateur</th><th className="px-4 py-4 font-semibold">Fiches</th><th className="px-4 py-4 font-semibold">Formules</th><th className="px-7 py-4 text-right font-semibold">Détail</th></tr></thead><tbody>{users.map(user => <UserRow key={user.id} user={user}/>)}</tbody></table></div> }
function UserRow({ user }: { user: ClientUser }) { const [open,setOpen]=useState(false); const formulas=Array.from(new Set(user.fiche.map(f=>formulaLabels[f.formule]))).join(", ")||"—"; return <><tr className="border-b border-[#f0f2f4]"><td className="px-7 py-4"><div className="flex items-center gap-3"><div className="avatar"><UserRound className="h-4 w-4"/></div><div><p className="font-semibold text-[#29344a]">{user.name||"Client sans nom"}</p><p className="text-xs text-[#8b94a3]">{user.email||"Aucun email"}</p></div></div></td><td className="px-4 py-4">{user._count.fiche}</td><td className="px-4 py-4 text-sm text-[#657084]">{formulas}</td><td className="px-7 py-4 text-right"><button type="button" onClick={()=>setOpen(v=>!v)} className="table-action" aria-expanded={open}><ChevronDown className={`h-4 w-4 ${open?"rotate-180":""}`}/></button></td></tr>{open&&<tr className="border-b border-[#edf0f2] bg-[#fafbfc]"><td colSpan={4} className="px-7 py-4"><div className="space-y-2 pl-10">{user.fiche.map(f=><Link key={f.id} href={`/studio/fiche/${f.slug}`} className="flex items-center justify-between rounded-lg border border-[#e6e8ec] bg-white px-4 py-3"><div><p className="text-sm font-semibold">{f.prenom} {f.nom}</p><p className="text-xs text-[#8b94a3]">{f.entreprise||f.slug}</p></div><div className="flex gap-4 text-xs text-[#657084]"><span>{formulaLabels[f.formule]}</span><span>{f.statut}</span><span>{f.scansTotal} passages</span></div></Link>)}</div></td></tr>}</> }

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
      <td className="px-4 py-4 text-sm text-[#657084]">
        {formulaLabels[fiche.formule]}
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
      </td>{" "}
      <td className="px-4 py-4 text-sm text-[#657084]">{fiche.owner ? <><p className="truncate font-medium">{fiche.owner.name || "Client sans nom"}</p><p className="truncate text-xs text-[#9aa3b1]">{fiche.owner.email || "—"}</p></> : <span className="text-[#9aa3b1]">Non rattachée</span>}</td>
      <td className="px-4 py-4 text-sm text-[#657084]">
        {formatDate(fiche.dateEcheance)}
      </td>
      <td className="px-7 py-4 text-right">
        <div className="flex justify-end gap-1">
          <Link
            href={`/studio/fiche/${fiche.slug}`}
            className="table-action"
            title="Ouvrir dans le studio"
            aria-label={`Modifier ${fiche.prenom} ${fiche.nom}`}
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <Link
            href={`/fiche/${fiche.slug}`}
            className="table-action"
            title="Voir la fiche publique"
            aria-label={`Voir ${fiche.prenom} ${fiche.nom}`}
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={onQr}
            className="table-action"
            title="Afficher le QR code"
            aria-label={`QR code de ${fiche.prenom} ${fiche.nom}`}
          >
            <QrCodeIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onStatus}
            disabled={!canToggle || busy}
            className="table-action disabled:cursor-not-allowed disabled:opacity-40"
            title={
              canToggle
                ? fiche.statut === "suspendue"
                  ? "Réactiver"
                  : "Suspendre"
                : "Action indisponible pour ce statut"
            }
            aria-label={
              canToggle
                ? fiche.statut === "suspendue"
                  ? "Réactiver"
                  : "Suspendre"
                : "Action indisponible"
            }
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

      <div className="mt-4 grid grid-cols-4 gap-2">
        <Link
          href={`/studio/fiche/${fiche.slug}`}
          className="rounded-lg bg-[#172033] py-2 text-center text-xs font-semibold text-white"
          title="Ouvrir dans le studio"
        >
          <Pencil className="mx-auto h-4 w-4" />
          <span className="sr-only">Studio</span>
        </Link>
        <Link
          href={`/fiche/${fiche.slug}`}
          className="rounded-lg border border-[#e6e8ec] py-2 text-center"
          title="Voir la fiche"
        >
          <Eye className="mx-auto h-4 w-4" />
          <span className="sr-only">Voir</span>
        </Link>
        <button
          type="button"
          onClick={onQr}
          className="rounded-lg border border-[#e6e8ec] py-2"
          title="Afficher le QR code"
        >
          <QrCodeIcon className="mx-auto h-4 w-4" />
          <span className="sr-only">QR code</span>
        </button>
        <button
          type="button"
          onClick={onStatus}
          disabled={!canToggle || busy}
          className="rounded-lg border border-[#e6e8ec] py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          title={
            canToggle
              ? fiche.statut === "suspendue"
                ? "Réactiver"
                : "Suspendre"
              : "Action indisponible"
          }
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
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fiche-qr-title"
    >
      <div className="qr-panel">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">QR code de la fiche</p>
            <h2
              id="fiche-qr-title"
              className="mt-1 text-xl font-semibold tracking-[-0.03em]"
            >
              {fiche.prenom} {fiche.nom}
            </h2>
            <p className="mt-1 text-sm text-[#7d8798]">
              À imprimer sur la carte ou à partager directement.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button"
            aria-label="Fermer"
          >
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
