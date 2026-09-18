import { TRPCError } from "@trpc/server";
import { prisma } from "../prisma/client";
import type {
  Fiche,
  OrganizationMembership,
  OrganizationMembershipRole,
} from "generated/prisma/client";

export async function getMembershipForUser(
  userId: number,
  organizationId: number
): Promise<OrganizationMembership | null> {
  return prisma.organizationMembership.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
  });
}

export async function listOrganizationsForUser(userId: number) {
  return prisma.organizationMembership.findMany({
    where: { userId },
    include: {
      organization: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function listAccessibleFiches(userId: number) {
  const memberships = await prisma.organizationMembership.findMany({
    where: { userId },
    select: { id: true, organizationId: true, role: true },
  });
  if (!memberships.length) return [];

  const ownerOrganizationIds = memberships
    .filter(m => m.role === "OWNER")
    .map(m => m.organizationId);
  const membershipIds = memberships.map(m => m.id);

  return prisma.fiche.findMany({
    where: {
      organizationId: { not: null },
      OR: [
        ...(ownerOrganizationIds.length
          ? [{ organizationId: { in: ownerOrganizationIds } }]
          : []),
        {
          accessGrants: {
            some: { membershipId: { in: membershipIds } },
          },
        },
      ],
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getAccessibleFiche(userId: number, ficheId: number) {
  const fiche = await prisma.fiche.findUnique({
    where: { id: ficheId },
  });

  if (!fiche || !fiche.organizationId) return null;

  const membership = await getMembershipForUser(userId, fiche.organizationId);
  if (!membership) return null;

  if (membership.role === "OWNER") {
    return { fiche, membership };
  }

  const access = await prisma.ficheAccess.findUnique({
    where: {
      ficheId_membershipId: {
        ficheId,
        membershipId: membership.id,
      },
    },
  });

  return access ? { fiche, membership } : null;
}

export async function assertCanViewFiche(userId: number, ficheId: number) {
  const result = await getAccessibleFiche(userId, ficheId);
  if (!result) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Vous n'avez pas accès à cette fiche.",
    });
  }
  return result;
}

export async function assertCanEditFiche(userId: number, ficheId: number) {
  const result = await assertCanViewFiche(userId, ficheId);

  if (
    result.membership.role !== "OWNER" &&
    result.membership.role !== "MEMBER" &&
    result.membership.role !== "ADMIN"
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Vous n'êtes pas autorisé à modifier cette fiche.",
    });
  }

  return result;
}

export async function assertCanManageOrganization(
  userId: number,
  organizationId: number
) {
  const membership = await getMembershipForUser(userId, organizationId);

  if (!membership || membership.role !== "OWNER") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Seul le propriétaire de l'organisation peut effectuer cette action.",
    });
  }

  return membership;
}

export function isOrganizationRole(
  role: string
): role is OrganizationMembershipRole {
  return ["OWNER", "ADMIN", "MEMBER", "VIEWER"].includes(role);
}

export type AccessibleFiche = Fiche;
