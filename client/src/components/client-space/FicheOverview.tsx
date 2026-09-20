import React from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  MessageSquare,
  Pencil,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import IdCard from "./IdCard";
import KpiTile from "./KpiTile";
import ScanChart from "./ScanChart";
import { getEcheanceStatus } from "@/lib/ficheStatus";
import { PremiumBadge, PremiumUpgradeModal } from "@/components/PremiumFeature";
import type { PlanName } from "@shared/planFeatures";

export default function FicheOverview({ ficheId }: { ficheId: number }) {
  const [, navigate] = useLocation();
  const [premiumFeature, setPremiumFeature] = React.useState<{ name: string; plan: PlanName } | null>(null);
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
        <button
          type="button"
          onClick={() =>
            fiche.plan.hasForm
              ? navigate(`/espace-client/fiche/${ficheId}/demandes`)
              : setPremiumFeature({ name: "Demandes reçues", plan: "signature" })
          }
          className="kpi-tile text-left transition hover:border-[#c98a4e]"
        >
          <div className="flex items-center justify-between gap-2">
            <MessageSquare size={17} className="text-[#7d8798]" />
            {!fiche.plan.hasForm && <Sparkles size={14} className="text-[#c98a4e]" aria-hidden="true" />}
          </div>
          <p className="kpi-tile-value" style={{ fontSize: 15 }}>
            {fiche.plan.hasForm ? data.requestCount : "Premium"}
          </p>
          <p className="kpi-tile-label">
            {fiche.plan.hasForm ? "Demandes reçues" : "Disponible avec Signature"}
          </p>
        </button>
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

      <div className="grid gap-5 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="panel">
          <div>
            <p className="panel-title">Actions rapides</p>
            <p className="panel-sub">
              Gérez votre fiche et consultez ses performances.
            </p>
          </div>
          <div className={`mt-4 grid gap-2 sm:grid-cols-${fiche.plan.hasForm ? "3" : "2"}`}>
            <QuickAction
              icon={Pencil}
              label="Modifier ma fiche"
              onClick={() =>
                navigate(`/espace-client/fiche/${ficheId}/modifier`)
              }
            />
            <QuickAction
              icon={BarChart3}
              label="Voir les statistiques"
              onClick={() =>
                navigate(`/espace-client/fiche/${ficheId}/statistiques`)
              }
            />
            <QuickAction
              icon={MessageSquare}
              label="Voir les demandes"
              premium={!fiche.plan.hasForm}
              onClick={() =>
                fiche.plan.hasForm
                  ? navigate(`/espace-client/fiche/${ficheId}/demandes`)
                  : setPremiumFeature({ name: "Demandes reçues", plan: "signature" })
              }
            />
          </div>
        </div>

        <div className="panel">
          <div>
            <p className="panel-title">Fonctionnalités de votre formule</p>
            <p className="panel-sub">
              Les capacités disponibles sur cette fiche.
            </p>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <CapabilityItem
              label="Liens personnalisés"
              value={fiche.plan.maxLinks > 0 ? `${fiche.plan.maxLinks}` : undefined}
              upgradePlan={fiche.plan.maxLinks === 0 ? "pro" : undefined}
              onUpgrade={() => setPremiumFeature({ name: "Liens personnalisés", plan: "pro" })}
            />
            <CapabilityItem
              label="Galerie"
              value={fiche.plan.maxPhotos > 0 ? `${fiche.plan.maxPhotos} photos` : undefined}
              upgradePlan={fiche.plan.maxPhotos === 0 ? "pro" : undefined}
              onUpgrade={() => setPremiumFeature({ name: "Galerie", plan: "pro" })}
            />
            <CapabilityItem
              label="Site web"
              enabled={fiche.plan.maxLinks > 0}
              upgradePlan={fiche.plan.maxLinks === 0 ? "pro" : undefined}
              onUpgrade={() => setPremiumFeature({ name: "Site web", plan: "pro" })}
            />
            <CapabilityItem
              label="Avis Google"
              enabled={fiche.plan.hasGoogleReview}
              upgradePlan={!fiche.plan.hasGoogleReview ? "pro" : undefined}
              onUpgrade={() => setPremiumFeature({ name: "Avis Google", plan: "pro" })}
            />
            <CapabilityItem
              label="Catalogue"
              enabled={fiche.plan.hasCatalog}
              upgradePlan={!fiche.plan.hasCatalog ? "signature" : undefined}
              onUpgrade={() => setPremiumFeature({ name: "Catalogue", plan: "signature" })}
            />
            <CapabilityItem
              label="Formulaire de rappel"
              enabled={fiche.plan.hasForm}
              upgradePlan={!fiche.plan.hasForm ? "signature" : undefined}
              onUpgrade={() => setPremiumFeature({ name: "Formulaire de rappel", plan: "signature" })}
            />
          </div>
        </div>
      </div>

      <div className={`grid gap-5 ${fiche.plan.hasForm ? "lg:grid-cols-[1.3fr,1fr]" : ""}`}>
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

        {fiche.plan.hasForm && (
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
        )}
      </div>

      {premiumFeature && (
        <PremiumUpgradeModal
          feature={premiumFeature.name}
          requiredPlan={premiumFeature.plan}
          open
          onClose={() => setPremiumFeature(null)}
        />
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


function QuickAction({
  icon: Icon,
  label,
  premium,
  onClick,
}: {
  icon: typeof Pencil;
  label: string;
  premium?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-2.5 rounded-xl border border-[#e6e8ec] bg-white px-3.5 py-3 text-left transition hover:border-[#c98a4e] hover:bg-[#fffaf4]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f4f5f7] text-[#667085] transition group-hover:bg-[#fff1df] group-hover:text-[#9a6a2a]">
        <Icon size={15} />
      </span>
      <span className="min-w-0 text-xs font-semibold text-[#344054]">
        {label}
      </span>
      {premium && <Sparkles size={13} className="ml-auto shrink-0 text-[#c98a4e]" aria-hidden="true" />}
      <ArrowRight
        size={14}
        className="ml-auto shrink-0 text-[#c1c8d3] transition group-hover:translate-x-0.5 group-hover:text-[#c98a4e]"
      />
    </button>
  );
}

function CapabilityItem({
  label,
  enabled,
  value,
  upgradePlan,
  onUpgrade,
}: {
  label: string;
  enabled?: boolean;
  value?: string;
  upgradePlan?: PlanName;
  onUpgrade?: () => void;
}) {
  const isActive = value !== undefined || enabled === true;
  return (
    <button
      type="button"
      disabled={!upgradePlan}
      onClick={onUpgrade}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-[#edf0f2] bg-[#fafbfc] px-3 py-2.5 text-left disabled:cursor-default"
      aria-label={upgradePlan ? `${label}, disponible avec ${upgradePlan}` : label}
    >
      <span className="text-xs font-medium text-[#52607a]">{label}</span>
      {upgradePlan ? (
        <PremiumBadge plan={upgradePlan} />
      ) : value ? (
        <span className="text-xs font-semibold text-[#172033]">{value}</span>
      ) : (
        <CheckCircle2
          size={15}
          className={isActive ? "text-emerald-600" : "text-[#c1c8d3]"}
          aria-label={isActive ? "Inclus" : "Non inclus"}
        />
      )}
    </button>
  );
}
