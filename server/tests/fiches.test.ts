import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import { getFicheBySlug, prisma, recordPassage, updateFiche } from "../db";
import type { TrpcContext } from "../_core/context";

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
    const caller = appRouter.createCaller(createPublicContext());
    const fiche = await getFicheBySlug("hotel-teranga");
    const before = fiche!.scansTotal;
    await caller.fiches.recordScan({ slug: "hotel-teranga" });
    expect((await getFicheBySlug("hotel-teranga"))?.scansTotal).toBe(before + 1);
    await updateFiche(fiche!.id, { scansTotal: before });
  });

  it("records each passage once for an idempotency key and keeps legacy aggregates in sync", async () => {
    const fiche = await getFicheBySlug("hotel-teranga");
    expect(fiche).toBeTruthy();
    const idempotencyKey = randomUUID();
    const today = new Date().toISOString().slice(0, 10);
    const before = await prisma.fiche.findUnique({ where: { id: fiche!.id } });
    const dailyBefore = await prisma.ficheScan.findUnique({
      where: { ficheId_scanDate: { ficheId: fiche!.id, scanDate: today } },
    });

    try {
      await expect(recordPassage(fiche!.id, "qr", idempotencyKey)).resolves.toBe(true);
      await expect(recordPassage(fiche!.id, "qr", idempotencyKey)).resolves.toBe(false);

      const after = await prisma.fiche.findUnique({ where: { id: fiche!.id } });
      expect(after?.scansTotal).toBe((before?.scansTotal ?? 0) + 1);
      expect(
        await prisma.fichePassage.count({ where: { idempotencyKey } })
      ).toBe(1);
      const dailyAfter = await prisma.ficheScan.findUnique({
        where: { ficheId_scanDate: { ficheId: fiche!.id, scanDate: today } },
      });
      expect(dailyAfter?.count).toBe((dailyBefore?.count ?? 0) + 1);
    } finally {
      await prisma.fichePassage.deleteMany({ where: { idempotencyKey } });
      await prisma.fiche.update({
        where: { id: fiche!.id },
        data: {
          scansTotal: before!.scansTotal,
          lastScanAt: before!.lastScanAt,
        },
      });
      if (dailyBefore) {
        await prisma.ficheScan.update({
          where: { ficheId_scanDate: { ficheId: fiche!.id, scanDate: today } },
          data: { count: dailyBefore.count },
        });
      } else {
        await prisma.ficheScan.deleteMany({
          where: { ficheId: fiche!.id, scanDate: today },
        });
      }
    }
  });


  it("records public QR, NFC and direct passages only for active fiches", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const fiche = await getFicheBySlug("hotel-teranga");
    expect(fiche).toBeTruthy();
    const keys = ["qr", "nfc", "direct"].map(() => randomUUID());
    const before = await prisma.fiche.findUnique({ where: { id: fiche!.id } });
    const today = new Date().toISOString().slice(0, 10);
    const dailyBefore = await prisma.ficheScan.findUnique({
      where: { ficheId_scanDate: { ficheId: fiche!.id, scanDate: today } },
    });

    try {
      for (const [index, source] of (["qr", "nfc", "direct"] as const).entries()) {
        await expect(
          caller.fiches.recordPassage({
            slug: fiche!.slug,
            source,
            idempotencyKey: keys[index],
          })
        ).resolves.toEqual({ ok: true, recorded: true });
      }
      const after = await prisma.fiche.findUnique({ where: { id: fiche!.id } });
      expect(after?.scansTotal).toBe((before?.scansTotal ?? 0) + 3);
      expect(await prisma.fichePassage.count({ where: { idempotencyKey: { in: keys } } })).toBe(3);

      const suspended = await getFicheBySlug("atelier-baobab");
      const suspendedResult = await caller.fiches.recordPassage({
        slug: suspended!.slug,
        source: "nfc",
        idempotencyKey: randomUUID(),
      });
      expect(suspendedResult).toEqual({ ok: false, recorded: false });
    } finally {
      await prisma.fichePassage.deleteMany({ where: { idempotencyKey: { in: keys } } });
      await prisma.fiche.update({
        where: { id: fiche!.id },
        data: { scansTotal: before!.scansTotal, lastScanAt: before!.lastScanAt },
      });
      if (dailyBefore) {
        await prisma.ficheScan.update({
          where: { ficheId_scanDate: { ficheId: fiche!.id, scanDate: today } },
          data: { count: dailyBefore.count },
        });
      } else {
        await prisma.ficheScan.deleteMany({ where: { ficheId: fiche!.id, scanDate: today } });
      }
    }
  });
});
