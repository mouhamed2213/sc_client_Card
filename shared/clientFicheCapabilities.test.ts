import { describe, expect, it } from "vitest";
import { getClientFicheCapabilities } from "./clientFicheCapabilities";

describe("client fiche capabilities", () => {
  it("allows Essential to edit only the basic public profile and hours", () => {
    const c = getClientFicheCapabilities("essentiel");
    expect(c.identity.editable).toBe(true);
    expect(c.contact.editable).toBe(true);
    expect(c.hours.editable).toBe(true);
    expect(c.profile.editable).toBe(false);
    expect(c.profile.upgradeTo).toBe("pro");
    expect(c.links.editable).toBe(false);
    expect(c.catalog.editable).toBe(false);
  });

  it("allows Pro to edit advanced public content except Signature-only features", () => {
    const c = getClientFicheCapabilities("pro");
    expect(c.profile.editable).toBe(true);
    expect(c.presentation.editable).toBe(true);
    expect(c.rendezVous.editable).toBe(true);
    expect(c.socials.editable).toBe(true);
    expect(c.links.maxItems).toBe(10);
    expect(c.gallery.maxItems).toBe(8);
    expect(c.catalog.editable).toBe(false);
    expect(c.catalog.upgradeTo).toBe("signature");
  });

  it("allows Signature to edit the complete public content", () => {
    const c = getClientFicheCapabilities("signature");
    for (const key of Object.keys(c) as Array<keyof typeof c>) {
      expect(c[key].editable).toBe(true);
    }
  });
});
