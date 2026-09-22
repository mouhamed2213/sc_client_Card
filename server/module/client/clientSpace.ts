import { getPlanFeatures } from "@shared/planFeatures";
import type { Fiche } from "../../database/generated/prisma/client";

import { prisma } from "../../database/prisma/client";
import { buildClientOverview, getOverviewEligibility } from "./clientOverview";

/**
 * What a client account may see of its own fiche row. Admin-only data never
 * leaves the server: internal notes always, and passage statistics unless the
 * plan includes the statistics panel (Signature).
 */
export function toClientFiche<T extends Fiche>(fiche: T): T {
  const plan = getPlanFeatures(fiche.formule);
  let dataJson = fiche.dataJson;
  try {
    const data = JSON.parse(dataJson || "{}");
    delete data.notesInternes;
    dataJson = JSON.stringify(data);
  } catch {
    // Keep the original payload if it is not valid JSON.
  }
  return {
    ...fiche,
    dataJson,
    scansTotal: plan.hasPanel ? fiche.scansTotal : 0,
    lastScanAt: plan.hasPanel ? fiche.lastScanAt : null,
  };
}

export async function updateMembershipCardStatus(
  id: number,
  statut: "active" | "perdue" | "revoquee"
) {
  return prisma.membershipCard.update({ where: { id }, data: { statut } });
}

export async function listClientDashboard(ficheId: number) {
  const [fiche, scans, requests, requestCount] = await Promise.all([
    prisma.fiche.findUnique({ where: { id: ficheId } }),
    prisma.ficheScan.findMany({
      where: {
        ficheId,
        scanDate: {
          gte: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
        },
      },
      orderBy: { scanDate: "asc" },
    }),
    prisma.contactRequest.findMany({
      where: { ficheId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.contactRequest.count({ where: { ficheId } }),
  ]);
  return {
    fiche,
    scans,
    recentRequests: requests,
    requestCount,
  };
}

/**
 * Overview of all the fiches owned by `ownerId`, optionally narrowed to one
 * fiche. Returns null when `ficheId` is given but not owned by this account.
 */
export async function getClientOverview(ownerId: number, ficheId?: number) {
  const owned = await prisma.fiche.findMany({
    where: { ownerId, ...(ficheId ? { id: ficheId } : {}) },
    orderBy: { updatedAt: "desc" },
  });
  if (ficheId && owned.length === 0) return null;

  const rules = owned.map(fiche => ({
    fiche,
    ...getOverviewEligibility(fiche),
  }));
  const statIds = rules.filter(r => r.statsAvailable).map(r => r.fiche.id);
  const requestIds = rules
    .filter(r => r.requestsAvailable)
    .map(r => r.fiche.id);
  const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const [scans, requestGroups, recentRequests] = await Promise.all([
    statIds.length
      ? prisma.ficheScan.findMany({
          where: { ficheId: { in: statIds }, scanDate: { gte: since } },
          orderBy: { scanDate: "asc" },
        })
      : [],
    requestIds.length
      ? prisma.contactRequest.groupBy({
          by: ["ficheId"],
          where: { ficheId: { in: requestIds } },
          _count: { _all: true },
        })
      : [],
    requestIds.length
      ? prisma.contactRequest.findMany({
          where: { ficheId: { in: requestIds } },
          orderBy: { createdAt: "desc" },
          take: 8,
        })
      : [],
  ]);

  return buildClientOverview({
    fiches: owned,
    scans,
    requestCounts: requestGroups.map(group => ({
      ficheId: group.ficheId,
      count: group._count._all,
    })),
    recentRequests,
  });
}
