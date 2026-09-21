import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { Fiche, User } from "../../generated/prisma/client";
import { prisma } from "../../prisma/client";
import { ENV } from "../_core/env";
import type { TrpcContext } from "../_core/context";
import { appRouter } from "../routers";
import {
  allowScanAttempt,
  handleScan,
  isBotUserAgent,
  resetScanRateLimit,
  visitorKey,
} from "../scans";

const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 14; SM-A146P) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36";

function req(headers: Record<string, string> = { "user-agent": MOBILE_UA }) {
  return { protocol: "https", headers } as TrpcContext["req"];
}

describe("passages — pure rules", () => {
  it("recognises crawlers, scripts and empty user agents, not real phones", () => {
    expect(isBotUserAgent("")).toBe(true);
    expect(isBotUserAgent(undefined)).toBe(true);
    expect(isBotUserAgent("Googlebot/2.1 (+http://www.google.com/bot.html)")).toBe(true);
    expect(isBotUserAgent("facebookexternalhit/1.1")).toBe(true);
    expect(isBotUserAgent("WhatsApp/2.24.5 A")).toBe(true);
    expect(isBotUserAgent("curl/8.5.0")).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 HeadlessChrome/126.0")).toBe(true);
    expect(isBotUserAgent(MOBILE_UA)).toBe(false);
    expect(
      isBotUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5) AppleWebKit/605.1.15 Safari/604.1")
    ).toBe(false);
  });

  it("hashes the visitor id and never leaks it", () => {
    const a = visitorKey("visitor-abc-123", "1.1.1.1", MOBILE_UA);
    expect(a).toHaveLength(40);
    expect(a).not.toContain("visitor");
    expect(visitorKey("visitor-abc-123", "9.9.9.9", "other")).toBe(a);
    expect(visitorKey("visitor-xyz-999", "1.1.1.1", MOBILE_UA)).not.toBe(a);
  });

  it("blocks floods from one IP on one fiche", () => {
    resetScanRateLimit();
    const results = Array.from({ length: 45 }, () => allowScanAttempt("ip|1", 1_000));
    expect(results.filter(Boolean)).toHaveLength(40);
    expect(allowScanAttempt("ip|2", 1_000)).toBe(true);
    expect(allowScanAttempt("ip|1", 1_000 + 11 * 60 * 1000)).toBe(true);
  });
});

describe("passages — recorded against a real database", () => {
  let fiche: Fiche;
  let owner: User;
  const admin = { id: -1, role: "admin" } as User;

  async function fresh() {
    return (await prisma.fiche.findUnique({ where: { id: fiche.id } }))!;
  }
  async function scan(
    overrides: {
      input?: Partial<Parameters<typeof handleScan>[0]["input"]>;
      user?: User | null;
      headers?: Record<string, string>;
      fiche?: Fiche;
    } = {}
  ) {
    return handleScan({
      fiche: overrides.fiche ?? (await fresh()),
      user: overrides.user ?? null,
      req: req(overrides.headers),
      input: { slug: fiche.slug, visitorId: "visitor-default-1", ...overrides.input },
    });
  }
  async function counters() {
    const current = await fresh();
    return {
      total: current.scansTotal,
      events: await prisma.ficheScanEvent.count({ where: { ficheId: fiche.id } }),
      daily: (await prisma.ficheScan.findMany({ where: { ficheId: fiche.id } })).reduce(
        (sum, row) => sum + row.count,
        0
      ),
    };
  }

  beforeAll(async () => {
    owner = await prisma.user.create({ data: { name: "Scan owner", role: "user" } });
    fiche = await prisma.fiche.create({
      data: {
        slug: `scan-test-${Date.now()}`,
        formule: "signature",
        statut: "active",
        nom: "Test",
        prenom: "Scan",
        fonction: "QA",
        entreprise: "Scan Test",
        telephone: "+221770000000",
        whatsapp: "+221770000000",
        dateEcheance: new Date(Date.now() + 86_400_000 * 30),
        dataJson: "{}",
        ownerId: owner.id,
      },
    });
  });
  afterEach(async () => {
    resetScanRateLimit();
    ENV.scanRequireSource = false;
    await prisma.ficheScanEvent.deleteMany({ where: { ficheId: fiche.id } });
    await prisma.ficheScan.deleteMany({ where: { ficheId: fiche.id } });
    await prisma.fiche.update({
      where: { id: fiche.id },
      data: { scansTotal: 0, lastScanAt: null, statut: "active" },
    });
  });
  afterAll(async () => {
    await prisma.fiche.delete({ where: { id: fiche.id } });
    await prisma.user.delete({ where: { id: owner.id } });
  });

  it("counts a genuine visit once, in the event log, the total and the daily aggregate", async () => {
    expect(await scan({ input: { source: "nfc" } })).toEqual({ ok: true, counted: true, source: "nfc" });
    expect(await counters()).toEqual({ total: 1, events: 1, daily: 1 });
    expect((await fresh()).lastScanAt).not.toBeNull();
  });

  it("does not count reloads or a second tab of the same visitor", async () => {
    await scan();
    expect(await scan()).toMatchObject({ counted: false, reason: "duplicate" });
    expect(await counters()).toEqual({ total: 1, events: 1, daily: 1 });
  });

  it("counts different visitors separately", async () => {
    await scan({ input: { visitorId: "visitor-aaaa-1" } });
    await scan({ input: { visitorId: "visitor-bbbb-2" } });
    expect(await counters()).toEqual({ total: 2, events: 2, daily: 2 });
  });

  it("counts a visitor again once the de-duplication window has passed", async () => {
    await scan();
    await prisma.ficheScanEvent.updateMany({
      where: { ficheId: fiche.id },
      data: { createdAt: new Date(Date.now() - 31 * 60 * 1000) },
    });
    expect(await scan()).toMatchObject({ counted: true });
    expect((await counters()).total).toBe(2);
  });

  it("stays exact under concurrent requests from the same visitor", async () => {
    const results = await Promise.all(Array.from({ length: 12 }, () => scan()));
    expect(results.filter(r => r.counted)).toHaveLength(1);
    expect(await counters()).toEqual({ total: 1, events: 1, daily: 1 });
  });

  it("never counts the admin previewing a fiche", async () => {
    expect(await scan({ user: admin })).toMatchObject({ counted: false, reason: "staff" });
    expect((await counters()).total).toBe(0);
  });

  it("never counts the owner viewing their own fiche", async () => {
    expect(await scan({ user: owner })).toMatchObject({ counted: false, reason: "owner" });
    expect((await counters()).total).toBe(0);
  });

  it("does not count another logged-in client (only staff/owner are excluded)", async () => {
    const other = { id: owner.id + 1000, role: "user" } as User;
    expect(await scan({ user: other })).toMatchObject({ counted: true });
  });

  it("never counts explicit previews", async () => {
    expect(await scan({ input: { preview: true } })).toMatchObject({ counted: false, reason: "preview" });
    expect((await counters()).total).toBe(0);
  });

  it("never counts bots, link previews or header-less scripts", async () => {
    expect(await scan({ headers: { "user-agent": "Googlebot/2.1" } })).toMatchObject({ reason: "bot" });
    expect(await scan({ headers: { "user-agent": "facebookexternalhit/1.1" } })).toMatchObject({ reason: "bot" });
    expect(await scan({ headers: {} })).toMatchObject({ reason: "bot" });
    expect((await counters()).total).toBe(0);
  });

  it("only counts active fiches", async () => {
    for (const statut of ["brouillon", "suspendue", "supprimee"] as const) {
      await prisma.fiche.update({ where: { id: fiche.id }, data: { statut } });
      expect(await scan()).toMatchObject({ counted: false, reason: "not_active" });
    }
    expect(await handleScan({ fiche: null, user: null, req: req(), input: { slug: "x" } })).toMatchObject({
      reason: "not_active",
    });
    expect((await counters()).total).toBe(0);
  });

  it("strict mode only counts visits carrying a card marker", async () => {
    ENV.scanRequireSource = true;
    expect(await scan()).toMatchObject({ counted: false, reason: "missing_source" });
    expect(await scan({ input: { source: "qr" } })).toMatchObject({ counted: true, source: "qr" });
    expect((await counters()).total).toBe(1);
  });

  it("caps a flood from a single IP even with fresh visitor ids", async () => {
    let counted = 0;
    for (let i = 0; i < 60; i++) {
      const result = await scan({
        input: { visitorId: `flood-visitor-${i}-x` },
        headers: { "user-agent": MOBILE_UA, "x-forwarded-for": "198.51.100.9" },
      });
      if (result.counted) counted++;
    }
    expect(counted).toBe(40);
    expect((await counters()).total).toBe(40);
  });

  it("keeps the three counters consistent through the public tRPC route", async () => {
    const caller = appRouter.createCaller({
      user: undefined,
      req: req(),
      res: {} as TrpcContext["res"],
    } as unknown as TrpcContext);
    const first = await caller.fiches.recordScan({ slug: fiche.slug, source: "qr", visitorId: "trpc-visitor-01" });
    const again = await caller.fiches.recordScan({ slug: fiche.slug, source: "qr", visitorId: "trpc-visitor-01" });
    expect(first).toMatchObject({ counted: true });
    expect(again).toMatchObject({ counted: false, reason: "duplicate" });
    expect(await counters()).toEqual({ total: 1, events: 1, daily: 1 });
  });
});
