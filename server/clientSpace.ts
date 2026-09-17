import { randomBytes } from "node:crypto";
import { prisma } from "../prisma/client";

export async function listInvitationsForFiche(ficheId: number) {
  return prisma.invitationClient.findMany({ where: { ficheId }, orderBy: { createdAt: "desc" } });
}

export async function revokeInvitation(id: number) {
  const invitation = await prisma.invitationClient.findUnique({ where: { id } });
  if (!invitation) throw new Error("INVITATION_NOT_FOUND");
  if (invitation.utilisee) throw new Error("INVITATION_ALREADY_USED");
  if (invitation.revokedAt) return invitation;
  return prisma.invitationClient.update({
    where: { id },
    data: { revokedAt: new Date(), token: `revoked_${randomBytes(24).toString("base64url")}` },
  });
}

export async function updateMembershipCardStatus(id: number, statut: "active" | "perdue" | "revoquee") {
  return prisma.membershipCard.update({ where: { id }, data: { statut } });
}

export async function listClientDashboard(ficheId: number) {
  const [fiche, scans, requests, cards, requestCount, cardCount] = await Promise.all([
    prisma.fiche.findUnique({ where: { id: ficheId } }),
    prisma.ficheScan.findMany({
      where: { ficheId, scanDate: { gte: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10) } },
      orderBy: { scanDate: "asc" },
    }),
    prisma.contactRequest.findMany({ where: { ficheId }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.membershipCard.findMany({ where: { ficheId }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.contactRequest.count({ where: { ficheId } }),
    prisma.membershipCard.count({ where: { ficheId } }),
  ]);
  return { fiche, scans, recentRequests: requests, recentCards: cards, requestCount, cardCount };
}
