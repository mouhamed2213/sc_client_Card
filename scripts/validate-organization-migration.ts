import { prisma } from "../prisma/client";

async function main() {
  const [orphanFiches, orphanInvitations, invalidAccess] = await Promise.all([
    prisma.fiche.findMany({
      where: { organizationId: null },
      select: { id: true, slug: true, ownerId: true, entreprise: true },
      orderBy: { id: "asc" },
    }),
    prisma.invitationClient.findMany({
      where: { organizationId: null },
      select: { id: true, ficheId: true, token: true },
      orderBy: { id: "asc" },
    }),
    prisma.ficheAccess.findMany({
      select: {
        id: true,
        ficheId: true,
        membershipId: true,
        fiche: { select: { organizationId: true } },
        membership: { select: { organizationId: true } },
      },
    }),
  ]);

  const crossOrganizationAccess = invalidAccess.filter(
    row =>
      row.fiche.organizationId !== null &&
      row.membership.organizationId !== row.fiche.organizationId
  );

  console.log(
    JSON.stringify(
      {
        ok: crossOrganizationAccess.length === 0,
        requiresReview: {
          orphanFiches: orphanFiches.length,
          orphanInvitations: orphanInvitations.length,
        },
        orphanFiches,
        orphanInvitations,
        crossOrganizationAccess,
      },
      null,
      2
    )
  );

  if (crossOrganizationAccess.length) {
    process.exitCode = 2;
  }
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
