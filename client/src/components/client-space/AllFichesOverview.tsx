import { keepPreviousData } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Layers3,
  MessageSquare,
  QrCode,
  Radio,
  ScanLine,
  Search,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { formuleLabels, getEcheanceStatus } from "@/lib/ficheStatus";
import KpiTile from "./KpiTile";
import ScanChart from "./ScanChart";
import { STATUS_LABELS, STATUS_STYLES } from "./FichesTable";

type FicheOption = {
  id: number;
  prenom: string;
  nom: string;
  entreprise: string;
  formule: string;
};

const label = (fiche: { prenom: string; nom: string; entreprise: string }) =>
  [`${fiche.prenom} ${fiche.nom}`.trim(), fiche.entreprise]
    .filter(Boolean)
    .join(" · ");

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Overview of every fiche of the account, filterable by fiche. The server
 * applies the plan rules (passages: Signature only; requests: form plans that
 * are neither suspended nor expired), the UI only displays what it receives.
 */
export default function AllFichesOverview({ fiches }: { fiches: FicheOption[] }) {
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState<"all" | number>("all");
  const [search, setSearch] = useState("");
  const overview = trpc.clientSpaceRouter.overview.useQuery(
    selected === "all" ? {} : { ficheId: selected },
    { placeholderData: keepPreviousData }
  );

  const data = overview.data;

  const normalize = (value: string) =>
    value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const query = normalize(search.trim());
  const visibleFiches = useMemo(() => {
    if (!data) return [];
    if (!query) return data.fiches;
    return data.fiches.filter(fiche =>
      normalize(
        `${fiche.prenom} ${fiche.nom} ${fiche.entreprise} ${fiche.fonction} ${fiche.slug}`
      ).includes(query)
    );
  }, [data, query]);

  const names = new Map(fiches.map(fiche => [fiche.id, label(fiche)]));
  const filtered = selected !== "all";
  const needsAttention = data
    ? data.counts.aRenouveler + data.counts.expiree + data.counts.suspendue
    : 0;

  const nextDue = data?.fiches
    .filter(f => f.statutMetier === "active" || f.statutMetier === "a_renouveler")
    .map(f => new Date(f.dateEcheance))
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const nextDueStatus = nextDue ? getEcheanceStatus(nextDue) : null;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Espace client</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#172033]">
            Vue d'ensemble
          </h1>
          <p className="mt-1 text-sm text-[#7d8798]">
            {filtered
              ? "Résumé de la fiche sélectionnée."
              : `Résumé de vos ${fiches.length} fiches.`}
          </p>
        </div>
        <div className="flex w-full flex-col gap-4 sm:flex-row md:w-auto">
          <label className="block w-full sm:w-64">
            <span className="mb-1.5 block text-[13px] font-semibold text-[#3a4761]">
              Filtrer par fiche
            </span>
            <select
              className="editor-input"
              value={selected}
              onChange={event =>
                setSelected(event.target.value === "all" ? "all" : Number(event.target.value))
              }
            >
              <option value="all">Toutes mes fiches ({fiches.length})</option>
              {fiches.map(fiche => (
                <option key={fiche.id} value={fiche.id}>
                  {label(fiche)}
                </option>
              ))}
            </select>
          </label>
          <label className="block w-full sm:w-64">
            <span className="mb-1.5 block text-[13px] font-semibold text-[#3a4761]">
              Rechercher
            </span>
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa3b1]"
                aria-hidden="true"
              />
              <input
                type="search"
                className="editor-input pl-9"
                placeholder="Nom, entreprise, fonction…"
                value={search}
                onChange={event => setSearch(event.target.value)}
                aria-label="Rechercher une fiche par nom, entreprise ou fonction"
              />
            </div>
          </label>
        </div>
      </div>

      {overview.isError ? (
        <p className="text-sm text-[#a3392f]" role="alert">
          Impossible de charger la vue d'ensemble.
        </p>
      ) : !data ? (
        <div className="client-kpis">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="kpi-tile h-[92px] animate-pulse bg-[#f4f5f7]" />
          ))}
        </div>
      ) : (
        <div className={`space-y-6 transition-opacity ${overview.isPlaceholderData ? "opacity-60" : ""}`}>
          {needsAttention > 0 && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              <AlertTriangle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>
                {[
                  data.counts.aRenouveler > 0 && `${data.counts.aRenouveler} à renouveler`,
                  data.counts.expiree > 0 && `${data.counts.expiree} expirée${data.counts.expiree > 1 ? "s" : ""}`,
                  data.counts.suspendue > 0 && `${data.counts.suspendue} suspendue${data.counts.suspendue > 1 ? "s" : ""}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                . Consultez le détail ci-dessous.
              </p>
            </div>
          )}

          <div className="client-kpis">
            <KpiTile
              icon={Layers3}
              value={data.counts.total}
              label={`${data.counts.total > 1 ? "Fiches" : "Fiche"} · ${data.counts.active} active${data.counts.active > 1 ? "s" : ""}`}
            />
            <KpiTile
              icon={ScanLine}
              value={data.scans.availableFor > 0 ? data.scans.total : "—"}
              label={
                data.scans.availableFor > 0
                  ? `Passages · 30 jours (${data.scans.availableFor} fiche${data.scans.availableFor > 1 ? "s" : ""})`
                  : "Passages · formule Signature"
              }
            />
            <KpiTile
              icon={QrCode}
              value={data.scans.availableFor > 0 ? data.scans.qr : "—"}
              label="QR Code · 30 jours"
            />
            <KpiTile
              icon={Radio}
              value={data.scans.availableFor > 0 ? data.scans.nfc : "—"}
              label="NFC · 30 jours"
            />
            <KpiTile
              icon={MessageSquare}
              value={data.requests.availableFor > 0 ? data.requests.total : "—"}
              label={
                data.requests.availableFor > 0
                  ? `Demandes reçues (${data.requests.availableFor} fiche${data.requests.availableFor > 1 ? "s" : ""})`
                  : "Demandes · formule Signature"
              }
            />
            <KpiTile
              icon={CalendarClock}
              value={nextDue ? formatDate(nextDue) : "—"}
              label={nextDueStatus ? `Prochaine échéance · ${nextDueStatus.label}` : "Prochaine échéance"}
            />
          </div>

          <div className={`grid gap-5 ${data.requests.availableFor > 0 ? "lg:grid-cols-[1.3fr,1fr]" : ""}`}>
            <div className="panel">
              <div>
                <p className="panel-title">Évolution des passages</p>
                <p className="panel-sub">30 derniers jours, fiches Signature uniquement</p>
              </div>
              <div className="mt-4">
                {data.scans.availableFor > 0 ? (
                  <ScanChart data={data.scans.byDay} />
                ) : (
                  <div className="flex h-[220px] items-center justify-center gap-2 rounded-xl border border-dashed border-[#e6e8ec] bg-[#fafbfc] text-sm text-[#7d8798]">
                    <Sparkles size={15} className="text-[#c98a4e]" aria-hidden="true" />
                    Disponible avec la formule Signature
                  </div>
                )}
              </div>
            </div>

            {data.requests.availableFor > 0 && (
              <div className="panel">
                <div>
                  <p className="panel-title">Dernières demandes</p>
                  <p className="panel-sub">Envoyées depuis vos fiches publiques</p>
                </div>
                <div className="mt-3">
                  {data.requests.recent.length === 0 ? (
                    <p className="py-8 text-center text-sm text-[#7d8798]">
                      Aucune demande pour le moment.
                    </p>
                  ) : (
                    data.requests.recent.map(request => (
                      <button
                        type="button"
                        key={request.id}
                        onClick={() => navigate(`/espace-client/fiche/${request.ficheId}/demandes`)}
                        className="activity-row w-full text-left"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#172033]">{request.name}</p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-[#7d8798]">{request.message}</p>
                          {!filtered && (
                            <p className="mt-0.5 truncate text-[11px] font-medium text-[#9a6a2a]">
                              {names.get(request.ficheId)}
                            </p>
                          )}
                        </div>
                        <time className="shrink-0 whitespace-nowrap text-xs text-[#9aa3b1]">
                          {new Date(request.createdAt).toLocaleDateString("fr-FR")}
                        </time>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <section className="rounded-2xl border border-[#e6e8ec] bg-white shadow-[0_12px_32px_rgba(23,32,51,0.04)]">
            <div className="border-b border-[#edf0f2] px-5 py-4 lg:px-7">
              <p className="panel-title">Détail par fiche</p>
              <p className="panel-sub">
                {query
                  ? `${visibleFiches.length} fiche${visibleFiches.length > 1 ? "s" : ""} sur ${data.fiches.length}`
                  : "Les passages et les demandes dépendent de la formule de chaque fiche."}
              </p>
            </div>
            <div className="overflow-x-auto">
              {visibleFiches.length === 0 ? (
                <p className="px-7 py-10 text-center text-sm text-[#7d8798]">
                  Aucune fiche ne correspond à « {search} ».
                </p>
              ) : (
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-[#edf0f2] text-left text-[11px] uppercase tracking-[0.13em] text-[#99a1ad]">
                    <th scope="col" className="px-7 py-4 font-semibold">Fiche</th>
                    <th scope="col" className="px-4 py-4 font-semibold">Formule</th>
                    <th scope="col" className="px-4 py-4 font-semibold">Statut</th>
                    <th scope="col" className="px-4 py-4 font-semibold">Passages · 30 j</th>
                    <th scope="col" className="px-4 py-4 font-semibold">Demandes</th>
                    <th scope="col" className="px-4 py-4 font-semibold">Échéance</th>
                    <th scope="col" className="px-7 py-4 text-right font-semibold">
                      <span className="sr-only">Ouvrir</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleFiches.map(fiche => (
                    <tr key={fiche.id} className="border-b border-[#f0f2f4] transition-colors last:border-0 hover:bg-[#fcfcfd]">
                      <td className="px-7 py-4">
                        <p className="font-semibold text-[#29344a]">{fiche.prenom} {fiche.nom}</p>
                        <p className="text-xs text-[#8b94a3]">{fiche.entreprise}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-[#657084]">
                        {formuleLabels[fiche.formule] ?? fiche.formule}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[fiche.statutMetier] ?? STATUS_STYLES.brouillon}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {STATUS_LABELS[fiche.statutMetier] ?? fiche.statutMetier}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-[#42506a]">
                        {fiche.scans30 ?? <span className="text-[#a3abb8]" title="Formule Signature uniquement">—</span>}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-[#42506a]">
                        {fiche.requestCount ?? <span className="text-[#a3abb8]" title="Indisponible pour cette fiche">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-[#657084]">
                        {formatDate(fiche.dateEcheance)}
                      </td>
                      <td className="px-7 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/espace-client/fiche/${fiche.id}`)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#c98a4e] hover:text-[#a86f3a]"
                          aria-label={`Ouvrir la fiche de ${fiche.prenom} ${fiche.nom}`}
                        >
                          Ouvrir <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
