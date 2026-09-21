/**
 * Aggregated "vue d'ensemble" of every fiche owned by a client account.
 *
 * Pure (no database access) so the rules can be unit-tested. They mirror the
 * per-fiche dashboard exactly, so the overview never shows more than the
 * individual pages would:
 *  - passages (scans) only for plans with the statistics panel (Signature);
 *  - callback requests only for plans with the form, and never while the fiche
 *    is suspended or expired;
 *  - internal notes and other admin-only fields are never part of the summary.
 */
import { getPlanFeatures } from "@shared/planFeatures";
import { getFicheBusinessStatus } from "./ficheLifecycle";

export type OverviewFicheInput = {
  id: number;
  slug: string;
  nom: string;
  prenom: string;
  entreprise: string;
  fonction: string;
  formule: "essentiel" | "pro" | "signature";
  statut: string;
  logo: string | null;
  dateEcheance: Date;
};

export type OverviewScanRow = { ficheId: number; scanDate: string; count: number };
export type OverviewRequestRow = {
  id: number;
  ficheId: number;
  name: string;
  message: string;
  createdAt: Date;
};

/** Which fiches may expose which data (also used to decide what to query). */
export function getOverviewEligibility(fiche: OverviewFicheInput) {
  const plan = getPlanFeatures(fiche.formule);
  const status = getFicheBusinessStatus(fiche);
  return {
    status,
    statsAvailable: plan.hasPanel,
    requestsAvailable:
      plan.hasForm && status !== "suspendue" && status !== "expiree",
  };
}

export function buildClientOverview(input: {
  fiches: OverviewFicheInput[];
  scans: OverviewScanRow[];
  requestCounts: { ficheId: number; count: number }[];
  recentRequests: OverviewRequestRow[];
}) {
  const scanByFiche = new Map<number, number>();
  const scanByDay = new Map<string, number>();
  const requestByFiche = new Map<number, number>();
  for (const row of input.requestCounts) requestByFiche.set(row.ficheId, row.count);

  const eligibility = new Map(
    input.fiches.map(fiche => [fiche.id, getOverviewEligibility(fiche)] as const)
  );

  // Defensive: rows for a fiche that must not expose them are ignored even if
  // the caller queried them.
  for (const row of input.scans) {
    if (!eligibility.get(row.ficheId)?.statsAvailable) continue;
    scanByFiche.set(row.ficheId, (scanByFiche.get(row.ficheId) ?? 0) + row.count);
    scanByDay.set(row.scanDate, (scanByDay.get(row.scanDate) ?? 0) + row.count);
  }

  const fiches = input.fiches.map(fiche => {
    const rules = eligibility.get(fiche.id)!;
    return {
      id: fiche.id,
      slug: fiche.slug,
      nom: fiche.nom,
      prenom: fiche.prenom,
      entreprise: fiche.entreprise,
      fonction: fiche.fonction,
      formule: fiche.formule,
      logo: fiche.logo,
      statut: fiche.statut,
      statutMetier: rules.status,
      dateEcheance: fiche.dateEcheance,
      scans30: rules.statsAvailable ? (scanByFiche.get(fiche.id) ?? 0) : null,
      requestCount: rules.requestsAvailable ? (requestByFiche.get(fiche.id) ?? 0) : null,
    };
  });

  const count = (predicate: (status: string) => boolean) =>
    fiches.filter(fiche => predicate(fiche.statutMetier)).length;

  const statsFiches = fiches.filter(fiche => fiche.scans30 !== null);
  const requestFiches = fiches.filter(fiche => fiche.requestCount !== null);

  const requestable = new Set(requestFiches.map(fiche => fiche.id));

  return {
    fiches,
    counts: {
      total: fiches.length,
      active: count(status => status === "active" || status === "a_renouveler"),
      aRenouveler: count(status => status === "a_renouveler"),
      expiree: count(status => status === "expiree"),
      suspendue: count(status => status === "suspendue"),
    },
    scans: {
      availableFor: statsFiches.length,
      total: statsFiches.reduce((sum, fiche) => sum + (fiche.scans30 ?? 0), 0),
      byDay: Array.from(scanByDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([scanDate, total]) => ({ scanDate, count: total })),
    },
    requests: {
      availableFor: requestFiches.length,
      total: requestFiches.reduce((sum, fiche) => sum + (fiche.requestCount ?? 0), 0),
      recent: input.recentRequests
        .filter(request => requestable.has(request.ficheId))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 8),
    },
  };
}
