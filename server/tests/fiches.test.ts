import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import { getFicheBySlug, updateFiche } from "../db";
import type { TrpcContext } from "../_core/context";
import { prisma } from "../../prisma/client";

function createPublicContext(): TrpcContext {
  return {
    user: undefined,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("fiches.public", () => {
  it("returns the demo fiche by slug when the database is empty", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const fiche = await caller.fiches.getBySlug({ slug: "hotel-teranga" });
    expect(fiche.slug).toBe("hotel-teranga");
    expect(fiche.data.sections?.[0]?.titre).toBe("Nos chambres");
  });

  it("rejects an unknown public slug", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.fiches.getBySlug({ slug: "inconnue" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("blocks incomplete Pro reactivation, then persists it after the required portrait is added", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const fiche = await getFicheBySlug("marie-diallo");
    expect(fiche).toBeTruthy();
    await caller.fiches.updateStatus({ id: fiche!.id, statut: "suspendue" });
    expect((await getFicheBySlug("marie-diallo"))?.statut).toBe("suspendue");
    if (!fiche!.photo && !fiche!.logo) {
      await expect(caller.fiches.updateStatus({ id: fiche!.id, statut: "active" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
      await updateFiche(fiche!.id, { photo: "/manus-storage/test-profile.webp" });
    }
    await caller.fiches.updateStatus({ id: fiche!.id, statut: "active" });
    expect((await getFicheBySlug("marie-diallo"))?.statut).toBe("active");
    await updateFiche(fiche!.id, { photo: fiche!.photo });
  });

  it("records a real scan and keeps the previous total after verification", async () => {
    const caller = appRouter.createCaller({
      ...createPublicContext(),
      req: {
        protocol: "https",
        headers: {
          "user-agent": "Mozilla/5.0 (Linux; Android 14) Chrome/126.0 Mobile Safari/537.36",
          "x-forwarded-for": "203.0.113.7",
        },
      } as TrpcContext["req"],
    });
    const fiche = await getFicheBySlug("hotel-teranga");
    const before = fiche!.scansTotal;
    const result = await caller.fiches.recordScan({
      slug: "hotel-teranga",
      source: "qr",
      visitorId: "fiches-test-visitor-1",
    });
    expect(result).toMatchObject({ counted: true });
    expect((await getFicheBySlug("hotel-teranga"))?.scansTotal).toBe(before + 1);
    await updateFiche(fiche!.id, { scansTotal: before });
    await prisma.ficheScanEvent.deleteMany({ where: { ficheId: fiche!.id } });
    await prisma.ficheScan.deleteMany({ where: { ficheId: fiche!.id } });
  });
});
