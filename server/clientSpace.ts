import { prisma } from "../prisma/client";

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
