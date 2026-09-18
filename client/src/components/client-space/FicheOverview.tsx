import { useLocation } from "wouter";
import {
  ArrowRight,
  CreditCard,
  MessageSquare,
  ScanLine,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import IdCard from "./IdCard";
import KpiTile from "./KpiTile";
import ScanChart from "./ScanChart";
import { cardStatusLabels, getEcheanceStatus } from "@/lib/ficheStatus";

export default function FicheOverview({ ficheId }: { ficheId: number }) {
  const [, navigate] = useLocation();
  const dashboard = trpc.clientSpaceRouter.dashboard.useQuery({ ficheId });

  if (dashboard.isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="id-card animate-pulse opacity-50" style={{ minHeight: 180 }} />
        <div className="client-kpis">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="kpi-tile h-[92px] animate-pulse bg-[#f4f5f7]" />
          ))}
        </div>
      </div>
    );
  }

  const data = dashboard.data;
  const fiche = data?.fiche;
  if (!fiche) {
    return (
      <p className="p-6 text-sm text-[#a3392f]">
        Impossible de charger cette fiche.
      </p>
    );
  }

  const scans = data.scans.reduce((sum, item) => sum + item.count, 0);
  const echeance = getEcheanceStatus(fiche.dateEcheance);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="grid gap-5 lg:grid-cols-[1.1fr,0.9fr]">
        <IdCard fiche={fiche} />
        <div className="flex flex-col justify-center gap-3">
          <div>
            <span className={`status-pill ${echeance.pillClass}`}>
              {echeance.label}
            </span>
            <p className="mt-2 text-sm text-[#7d8798]">
              Échéance le{" "}
              {new Date(fiche.dateEcheance).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              . {fiche.plan.hasPanel ? "Votre formule inclut le panneau de gestion avancé." : ""}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:max-w-sm">
            <MiniStat label="Liens max" value={fiche.plan.maxLinks} />
            <MiniStat label="Photos max" value={fiche.plan.maxPhotos} />
            <MiniStat label="Catalogue" value={fiche.plan.hasCatalog ? "Oui" : "Non"} />
          </div>
        </div>
      </div>

      <div className="client-kpis">
        <KpiTile icon={ScanLine} label="Scans · 30 jours" value={scans} />
        <KpiTile
          icon={MessageSquare}
          label="Demandes reçues"
          value={data.requestCount}
        />
        <KpiTile icon={CreditCard} label="Cartes membres" value={data.cardCount} />
        <button
          onClick={() => navigate(`/espace-client/fiche/${ficheId}/statistiques`)}
          className="kpi-tile text-left transition hover:border-[#c98a4e]"
        >
          <ScanLine size={17} className="text-[#7d8798]" />
          <p className="kpi-tile-value" style={{ fontSize: 15 }}>
            Voir le détail
          </p>
          <p className="kpi-tile-label">Statistiques complètes →</p>
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr,1fr]">
        <div className="panel">
          <div className="flex items-center justify-between">
            <div>
              <p className="panel-title">Évolution des scans</p>
              <p className="panel-sub">30 derniers jours</p>
            </div>
          </div>
          <div className="mt-4">
            <ScanChart data={data.scans} />
          </div>
        </div>

        <div className="panel">
          <div className="flex items-center justify-between">
            <div>
              <p className="panel-title">Dernières demandes</p>
              <p className="panel-sub">Envoyées depuis votre fiche publique</p>
            </div>
            {data.recentRequests.length > 0 && (
              <button
                onClick={() => navigate(`/espace-client/fiche/${ficheId}/demandes`)}
                className="flex items-center gap-1 text-xs font-medium text-[#c98a4e] hover:text-[#a86f3a]"
              >
                Tout voir <ArrowRight size={13} />
              </button>
            )}
          </div>
          <div className="mt-3">
            {!data.recentRequests.length ? (
              <p className="py-8 text-center text-sm text-[#7d8798]">
                Aucune demande pour le moment.
              </p>
            ) : (
              data.recentRequests.map(req => (
                <div key={req.id} className="activity-row">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#172033]">
                      {req.name}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-[#7d8798]">
                      {req.message}
                    </p>
                  </div>
                  <time className="shrink-0 whitespace-nowrap text-xs text-[#9aa3b1]">
                    {new Date(req.createdAt).toLocaleDateString("fr-FR")}
                  </time>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {data.recentCards.length > 0 && (
        <div className="panel">
          <div className="flex items-center justify-between">
            <div>
              <p className="panel-title">Cartes membres</p>
              <p className="panel-sub">Dernières cartes enregistrées</p>
            </div>
            <button
              onClick={() => navigate(`/espace-client/fiche/${ficheId}/cartes`)}
              className="flex items-center gap-1 text-xs font-medium text-[#c98a4e] hover:text-[#a86f3a]"
            >
              Tout voir <ArrowRight size={13} />
            </button>
          </div>
          <div className="mt-1">
            {data.recentCards.map(card => (
              <div key={card.id} className="activity-row">
                <span className="font-mono text-sm text-[#172033]">{card.numero}</span>
                <span
                  className={`status-pill ${
                    card.statut === "active"
                      ? "status-pill-ok"
                      : card.statut === "perdue"
                        ? "status-pill-warn"
                        : "status-pill-danger"
                  }`}
                >
                  {cardStatusLabels[card.statut]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[#e6e8ec] bg-white px-3 py-2.5 text-center">
      <p className="text-base font-semibold text-[#172033]">{value}</p>
      <p className="mt-0.5 text-[10.5px] text-[#7d8798]">{label}</p>
    </div>
  );
}
