import { getPlanFeatures } from "@shared/planFeatures";
import type { Fiche } from "../generated/prisma/client";
import { prisma } from "../prisma/client";

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
  const [fiche, scans, requests, requestCount] =
    await Promise.all([
      prisma.fiche.findUnique({ where: { id: ficheId } }),
      prisma.ficheScan.findMany({
        where: {
          ficheId,
          scanDate: {
            gte: new Date(Date.now() - 30 * 86400000)
              .toISOString()
              .slice(0, 10),
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
