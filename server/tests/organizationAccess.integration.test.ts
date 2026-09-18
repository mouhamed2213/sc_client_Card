import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const auth = vi.hoisted(() => ({
  assertCanViewFiche: vi.fn(),
  assertCanEditFiche: vi.fn(),
  assertCanManageOrganization: vi.fn(),
}));

vi.mock("../authorization", () => auth);

vi.mock("../clientSpace", async () => {
  const actual = await vi.importActual<typeof import("../clientSpace")>("../clientSpace");
  return {
    ...actual,
    listClientDashboard: vi.fn(async () => ({
      fiche: { id: 10, dataJson: "{}", formule: "signature" },
      scans: [],
      contactRequests: [],
      membershipCards: [],
    })),
    listScansForFiche: vi.fn(async () => []),
    listContactRequests: vi.fn(async () => []),
    listMembershipCards: vi.fn(async () => []),
  };
});

const { appRouter } = await import("../routers");

function context(userId = 8): TrpcContext {
  return {
    user: { id: userId, name: "Test User", email: "test@example.com", role: "user" } as TrpcContext["user"],
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("organization access integration", () => {
  it("blocks a direct fiche URL through the dashboard endpoint when the user has no access", async () => {
    auth.assertCanViewFiche.mockRejectedValueOnce(new Error("FORBIDDEN"));
    const caller = appRouter.createCaller(context());
    await expect(caller.clientSpaceRouter.dashboard({ ficheId: 999 })).rejects.toThrow("FORBIDDEN");
  });

  it("uses the same authorization boundary for statistics, requests and member cards", async () => {
    const caller = appRouter.createCaller(context());

    for (const endpoint of [
      () => caller.clientSpaceRouter.scans({ ficheId: 999, days: 30 }),
      () => caller.clientSpaceRouter.contactRequests({ ficheId: 999 }),
      () => caller.clientSpaceRouter.membershipCards({ ficheId: 999 }),
    ]) {
      auth.assertCanViewFiche.mockRejectedValueOnce(new Error("FORBIDDEN"));
      await expect(endpoint()).rejects.toThrow("FORBIDDEN");
    }
  });

  it("allows an authorized MEMBER to reach the private dashboard", async () => {
    auth.assertCanViewFiche.mockResolvedValueOnce({
      fiche: { id: 10, organizationId: 100 },
      membership: { id: 2, organizationId: 100, userId: 8, role: "MEMBER" },
    });

    const caller = appRouter.createCaller(context());
    const result = await caller.clientSpaceRouter.dashboard({ ficheId: 10 });

    expect(result.fiche?.id).toBe(10);
    expect(auth.assertCanViewFiche).toHaveBeenCalledWith(8, 10);
  });

  it("allows only the OWNER to invite organization members", async () => {
    auth.assertCanManageOrganization.mockResolvedValueOnce({
      id: 1,
      organizationId: 100,
      userId: 8,
      role: "OWNER",
    });
    const caller = appRouter.createCaller(context(8));
    await expect(
      caller.clientSpaceRouter.inviteMember({
        organizationId: 100,
        role: "MEMBER",
        ficheId: 10,
      })
    ).rejects.toThrow();
  });

  it("blocks organization fiche grants when the membership is outside the organization", async () => {
    auth.assertCanManageOrganization.mockResolvedValueOnce({
      id: 1,
      organizationId: 100,
      userId: 8,
      role: "OWNER",
    });
    const caller = appRouter.createCaller(context(8));
    await expect(
      caller.clientSpaceRouter.grantOrganizationFicheAccess({
        organizationId: 100,
        ficheId: 10,
        membershipId: 999,
      })
    ).rejects.toThrow("Membre introuvable dans cette organisation.");
  });

  it("prevents a VIEWER from reaching the edit endpoint", async () => {
    auth.assertCanEditFiche.mockRejectedValueOnce(new Error("FORBIDDEN"));
    const caller = appRouter.createCaller(context(9));

    await expect(
      caller.clientSpaceRouter.updateContact({
        ficheId: 10,
        nom: "Doe",
        prenom: "Jane",
        fonction: "Direction",
        entreprise: "Test",
        telephone: "770000000",
        whatsapp: "770000000",
      })
    ).rejects.toThrow("FORBIDDEN");
  });
});
