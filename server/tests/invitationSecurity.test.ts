import { describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(),
}));

vi.mock("../../prisma/client", () => ({ prisma: prismaMock }));

const { consumeInvitation } = await import("../db");

function invitation(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    token: "token",
    utilisee: false,
    revokedAt: null,
    expireLe: new Date(Date.now() + 86_400_000),
    invitedUserId: null,
    organizationId: 100,
    role: "MEMBER",
    ficheId: 10,
    acceptedAt: null,
    ...overrides,
  };
}

describe("organization invitation security", () => {
  it("rejects a revoked invitation", async () => {
    const tx = {
      invitationClient: { findUnique: vi.fn().mockResolvedValue(invitation({ revokedAt: new Date() })) },
    };
    prismaMock.$transaction.mockImplementation(async (callback: any) => callback(tx));

    await expect(consumeInvitation("token", 8)).rejects.toThrow("INVITATION_REVOKED");
  });

  it("rejects an expired invitation", async () => {
    const tx = {
      invitationClient: { findUnique: vi.fn().mockResolvedValue(invitation({ expireLe: new Date(Date.now() - 1000) })) },
    };
    prismaMock.$transaction.mockImplementation(async (callback: any) => callback(tx));

    await expect(consumeInvitation("token", 8)).rejects.toThrow("INVITATION_EXPIRED");
  });

  it("rejects an invitation targeted to another user", async () => {
    const tx = {
      invitationClient: { findUnique: vi.fn().mockResolvedValue(invitation({ invitedUserId: 99 })) },
    };
    prismaMock.$transaction.mockImplementation(async (callback: any) => callback(tx));

    await expect(consumeInvitation("token", 8)).rejects.toThrow("INVITATION_USER_MISMATCH");
  });

  it("creates membership and fiche access atomically for a MEMBER invitation", async () => {
    const tx = {
      invitationClient: {
        findUnique: vi.fn().mockResolvedValue(invitation()),
        update: vi.fn().mockResolvedValue({}),
      },
      organization: {
        findUnique: vi.fn().mockResolvedValue({ id: 100 }),
      },
      organizationMembership: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 7, organizationId: 100, userId: 8, role: "MEMBER" }),
        update: vi.fn(),
      },
      fiche: {
        findFirst: vi.fn().mockResolvedValue({ id: 10, organizationId: 100 }),
      },
      ficheAccess: {
        upsert: vi.fn().mockResolvedValue({ id: 20 }),
      },
    };
    prismaMock.$transaction.mockImplementation(async (callback: any) => callback(tx));

    const result = await consumeInvitation("token", 8);

    expect(result).toMatchObject({ id: 7, role: "MEMBER" });
    expect(tx.ficheAccess.upsert).toHaveBeenCalled();
    expect(tx.invitationClient.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { utilisee: true, acceptedAt: expect.any(Date) },
    });
  });

  it("does not grant a fiche when an OWNER invitation is consumed", async () => {
    const tx = {
      invitationClient: {
        findUnique: vi.fn().mockResolvedValue(invitation({ role: "OWNER", ficheId: null })),
        update: vi.fn().mockResolvedValue({}),
      },
      organization: { findUnique: vi.fn().mockResolvedValue({ id: 100 }) },
      organizationMembership: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 1, organizationId: 100, userId: 8, role: "OWNER" }),
        update: vi.fn(),
      },
      ficheAccess: { upsert: vi.fn() },
    };
    prismaMock.$transaction.mockImplementation(async (callback: any) => callback(tx));

    await consumeInvitation("token", 8);

    expect(tx.ficheAccess.upsert).not.toHaveBeenCalled();
  });
});


  it("applies an OWNER invitation to an existing non-owner membership", async () => {
    const tx = {
      invitationClient: {
        findUnique: vi.fn().mockResolvedValue(invitation({ role: "OWNER", ficheId: null })),
        update: vi.fn().mockResolvedValue({}),
      },
      organization: { findUnique: vi.fn().mockResolvedValue({ id: 100 }) },
      organizationMembership: {
        findUnique: vi.fn().mockResolvedValue({
          id: 7, organizationId: 100, userId: 8, role: "MEMBER",
        }),
        update: vi.fn().mockResolvedValue({
          id: 7, organizationId: 100, userId: 8, role: "OWNER",
        }),
        create: vi.fn(),
      },
      ficheAccess: { upsert: vi.fn() },
    };
    prismaMock.$transaction.mockImplementation(async (callback: any) => callback(tx));

    const result = await consumeInvitation("token", 8);

    expect(result).toMatchObject({ id: 7, role: "OWNER" });
    expect(tx.organizationMembership.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { role: "OWNER" },
    });
    expect(tx.organizationMembership.create).not.toHaveBeenCalled();
  });
