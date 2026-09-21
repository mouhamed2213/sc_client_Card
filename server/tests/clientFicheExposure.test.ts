import { describe, expect, it } from "vitest";
import type { Fiche } from "../../generated/prisma/client";
import { toClientFiche } from "../clientSpace";

function fiche(formule: "essentiel" | "pro" | "signature"): Fiche {
  return {
    id: 1,
    formule,
    scansTotal: 42,
    lastScanAt: new Date("2026-09-20T10:00:00Z"),
    dataJson: JSON.stringify({ presentation: "Bonjour", notesInternes: "Relancer le client" }),
  } as unknown as Fiche;
}

describe("what a client account can see of its own fiche", () => {
  it.each(["essentiel", "pro"] as const)("hides passage statistics on %s", plan => {
    const result = toClientFiche(fiche(plan));
    expect(result.scansTotal).toBe(0);
    expect(result.lastScanAt).toBeNull();
  });

  it("keeps passage statistics on Signature", () => {
    const result = toClientFiche(fiche("signature"));
    expect(result.scansTotal).toBe(42);
    expect(result.lastScanAt).not.toBeNull();
  });

  it.each(["essentiel", "pro", "signature"] as const)("never exposes internal notes on %s", plan => {
    const data = JSON.parse(toClientFiche(fiche(plan)).dataJson);
    expect(data.notesInternes).toBeUndefined();
    expect(data.presentation).toBe("Bonjour");
  });

  it("does not mutate the stored row and tolerates invalid JSON", () => {
    const original = fiche("signature");
    toClientFiche(original);
    expect(JSON.parse(original.dataJson).notesInternes).toBe("Relancer le client");
    expect(toClientFiche({ ...original, dataJson: "not json" } as Fiche).dataJson).toBe("not json");
  });
});
