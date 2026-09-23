import { describe, expect, it } from "vitest";
import {
  buildClientOverview,
  type OverviewFicheInput,
} from "../clientOverview";

const future = new Date(Date.now() + 90 * 86400000);
const soon = new Date(Date.now() + 10 * 86400000);
const past = new Date(Date.now() - 5 * 86400000);

function fiche(
  id: number,
  formule: OverviewFicheInput["formule"],
  overrides: Partial<OverviewFicheInput> = {}
): OverviewFicheInput {
  return {
    id,
    slug: `fiche-${id}`,
    nom: "Nom",
    prenom: "Prénom",
    entreprise: "Entreprise",
    fonction: "Fonction",
    formule,
    statut: "active",
    logo: null,
    dateEcheance: future,
    ...overrides,
  };
}

describe("client overview across fiches", () => {
  const fiches = [
    fiche(1, "essentiel"),
    fiche(2, "pro", { dateEcheance: soon }),
    fiche(3, "signature"),
    fiche(4, "signature", { dateEcheance: past }),
    fiche(5, "signature", { statut: "suspendue" }),
  ];

  const result = buildClientOverview({
    fiches,
    scans: [
      { ficheId: 3, scanDate: "2026-09-19", count: 4, qrCount: 3, nfcCount: 1, unclassifiedCount: 0 },
      { ficheId: 3, scanDate: "2026-09-20", count: 6, qrCount: 2, nfcCount: 4, unclassifiedCount: 0 },
      { ficheId: 4, scanDate: "2026-09-20", count: 3, qrCount: 1, nfcCount: 2, unclassifiedCount: 0 },
      // A row for a plan without statistics must never be counted.
      { ficheId: 1, scanDate: "2026-09-20", count: 99, qrCount: 99, nfcCount: 0, unclassifiedCount: 0 },
    ],
    requestCounts: [
      { ficheId: 3, count: 2 },
      { ficheId: 4, count: 7 },
      { ficheId: 5, count: 5 },
      { ficheId: 2, count: 50 },
    ],
    recentRequests: [
      { id: 1, ficheId: 3, name: "A", message: "m", createdAt: new Date("2026-09-19") },
      { id: 2, ficheId: 3, name: "B", message: "m", createdAt: new Date("2026-09-20") },
      { id: 3, ficheId: 4, name: "C", message: "m", createdAt: new Date("2026-09-21") },
      { id: 4, ficheId: 2, name: "D", message: "m", createdAt: new Date("2026-09-21") },
    ],
  });

  it("counts fiches by business status", () => {
    expect(result.counts).toEqual({
      total: 5,
      active: 3,
      aRenouveler: 1,
      expiree: 1,
      suspendue: 1,
    });
  });

  it("only counts passages of plans with the statistics panel", () => {
    expect(result.scans.availableFor).toBe(3);
    expect(result.scans.total).toBe(4 + 6 + 3);
    expect(result.scans.qr).toBe(3 + 2 + 1);
    expect(result.scans.nfc).toBe(1 + 4 + 2);
    expect(result.scans.byDay).toEqual([
      { scanDate: "2026-09-19", count: 4 },
      { scanDate: "2026-09-20", count: 9 },
    ]);
    const byId = new Map(result.fiches.map(f => [f.id, f]));
    expect(byId.get(1)?.scans30).toBeNull();
    expect(byId.get(2)?.scans30).toBeNull();
  });

  it("only counts requests of plans with the form, never for suspended or expired fiches", () => {
    const byId = new Map(result.fiches.map(f => [f.id, f]));
    expect(byId.get(3)?.requestCount).toBe(2);
    expect(byId.get(2)?.requestCount).toBeNull(); // Pro: no form
    expect(byId.get(4)?.requestCount).toBeNull(); // expired
    expect(byId.get(5)?.requestCount).toBeNull(); // suspended
    expect(result.requests.total).toBe(2);
    expect(result.requests.recent.map(r => r.id)).toEqual([2, 1]);
  });

  it("does not expose internal fields of the fiche", () => {
    const keys = Object.keys(result.fiches[0]);
    expect(keys).not.toContain("dataJson");
    expect(keys).not.toContain("scansTotal");
    expect(keys).not.toContain("ownerId");
  });
});
