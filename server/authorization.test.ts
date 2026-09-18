import { describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  fiche: { findUnique: vi.fn() },
  organizationMembership: { findUnique: vi.fn(), findMany: vi.fn() },
  ficheAccess: { findUnique: vi.fn() },
}));

vi.mock("../prisma/client", () => ({ prisma: prismaMock }));

const { assertCanViewFiche, assertCanEditFiche, listAccessibleFiches } = await import("./authorization");

function reset() {
  prismaMock.fiche.findUnique.mockReset();
  prismaMock.organizationMembership.findUnique.mockReset();
  prismaMock.organizationMembership.findMany.mockReset();
  prismaMock.ficheAccess.findUnique.mockReset();
}

describe("organization authorization", () => {
  it("gives OWNER access to every fiche in their organization", async () => {
    reset();
    prismaMock.fiche.findUnique.mockResolvedValue({ id: 10, organizationId: 100 });
    prismaMock.organizationMembership.findUnique.mockResolvedValue({
      id: 1,
      organizationId: 100,
      userId: 7,
      role: "OWNER",
    });

    const result = await assertCanViewFiche(7, 10);

    expect(result.membership.role).toBe("OWNER");
    expect(prismaMock.ficheAccess.findUnique).not.toHaveBeenCalled();
  });

  it("requires an explicit grant for MEMBER access", async () => {
    reset();
    prismaMock.fiche.findUnique.mockResolvedValue({ id: 10, organizationId: 100 });
    prismaMock.organizationMembership.findUnique.mockResolvedValue({
      id: 2,
      organizationId: 100,
      userId: 8,
      role: "MEMBER",
    });
    prismaMock.ficheAccess.findUnique.mockResolvedValue({
      id: 50,
      ficheId: 10,
      membershipId: 2,
    });

    await expect(assertCanViewFiche(8, 10)).resolves.toMatchObject({
      membership: { role: "MEMBER" },
    });
  });

  it("denies MEMBER access without an explicit grant", async () => {
    reset();
    prismaMock.fiche.findUnique.mockResolvedValue({ id: 10, organizationId: 100 });
    prismaMock.organizationMembership.findUnique.mockResolvedValue({
      id: 2,
      organizationId: 100,
      userId: 8,
      role: "MEMBER",
    });
    prismaMock.ficheAccess.findUnique.mockResolvedValue(null);

    await expect(assertCanViewFiche(8, 10)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("denies cross-organization access even when a grant id is forged", async () => {
    reset();
    prismaMock.fiche.findUnique.mockResolvedValue({ id: 10, organizationId: 100 });
    prismaMock.organizationMembership.findUnique.mockResolvedValue(null);

    await expect(assertCanViewFiche(8, 10)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(prismaMock.ficheAccess.findUnique).not.toHaveBeenCalled();
  });

  it("denies VIEWER editing even when the viewer has a grant", async () => {
    reset();
    prismaMock.fiche.findUnique.mockResolvedValue({ id: 10, organizationId: 100 });
    prismaMock.organizationMembership.findUnique.mockResolvedValue({
      id: 3,
      organizationId: 100,
      userId: 9,
      role: "VIEWER",
    });
    prismaMock.ficheAccess.findUnique.mockResolvedValue({
      id: 51,
      ficheId: 10,
      membershipId: 3,
    });

    await expect(assertCanEditFiche(9, 10)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows MEMBER editing only after explicit access", async () => {
    reset();
    prismaMock.fiche.findUnique.mockResolvedValue({ id: 10, organizationId: 100 });
    prismaMock.organizationMembership.findUnique.mockResolvedValue({
      id: 2,
      organizationId: 100,
      userId: 8,
      role: "MEMBER",
    });
    prismaMock.ficheAccess.findUnique.mockResolvedValue({
      id: 50,
      ficheId: 10,
      membershipId: 2,
    });

    await expect(assertCanEditFiche(8, 10)).resolves.toMatchObject({
      membership: { role: "MEMBER" },
    });
  });
});


  it("treats ADMIN like an explicitly assigned card user, never as organization-wide access", async () => {
    reset();
    prismaMock.fiche.findUnique.mockResolvedValue({ id: 10, organizationId: 100 });
    prismaMock.organizationMembership.findUnique.mockResolvedValue({
      id: 4,
      organizationId: 100,
      userId: 11,
      role: "ADMIN",
    });
    prismaMock.ficheAccess.findUnique.mockResolvedValue(null);

    await expect(assertCanViewFiche(11, 10)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(prismaMock.ficheAccess.findUnique).toHaveBeenCalledWith({
      where: {
        ficheId_membershipId: {
          ficheId: 10,
          membershipId: 4,
        },
      },
    });
  });

  it("allows OWNER editing without a fiche-level access grant", async () => {
    reset();
    prismaMock.fiche.findUnique.mockResolvedValue({ id: 10, organizationId: 100 });
    prismaMock.organizationMembership.findUnique.mockResolvedValue({
      id: 1,
      organizationId: 100,
      userId: 7,
      role: "OWNER",
    });

    await expect(assertCanEditFiche(7, 10)).resolves.toMatchObject({
      membership: { role: "OWNER" },
    });
    expect(prismaMock.ficheAccess.findUnique).not.toHaveBeenCalled();
  });


  it("lists all organization fiches for OWNER and only explicit grants for other memberships", async () => {
    reset();
    prismaMock.organizationMembership.findMany.mockResolvedValue([
      { id: 1, organizationId: 100, role: "OWNER" },
      { id: 2, organizationId: 200, role: "MEMBER" },
    ]);
    prismaMock.fiche.findMany.mockResolvedValue([
      { id: 10, organizationId: 100 },
      { id: 20, organizationId: 200 },
    ]);

    await listAccessibleFiches(7);

    expect(prismaMock.fiche.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: { not: null },
        OR: [
          { organizationId: { in: [100] } },
          { accessGrants: { some: { membershipId: { in: [1, 2] } } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
    });
  });
