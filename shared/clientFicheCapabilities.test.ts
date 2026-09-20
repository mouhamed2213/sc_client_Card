import { describe, expect, it } from "vitest";
import { getClientFicheCapabilities } from "./clientFicheCapabilities";
import { getPlanFeatures } from "./planFeatures";

describe("client fiche capabilities", () => {
  it("allows Essential to edit basic public content while locking Pro and Signature features", () => {
    const c = getClientFicheCapabilities("essentiel");
    expect(c.identity.editable).toBe(true);
    expect(c.contact.editable).toBe(true);
    expect(c.profile.editable).toBe(true);
    expect(c.presentation.editable).toBe(true);
    expect(c.hours.editable).toBe(true);
    expect(c.site.upgradeTo).toBe("pro");
    expect(c.rendezVous.upgradeTo).toBe("pro");
    expect(c.socials.upgradeTo).toBe("pro");
    expect(c.links.editable).toBe(false);
    expect(c.gallery.editable).toBe(false);
    expect(c.googleReview.upgradeTo).toBe("pro");
    expect(c.catalog.upgradeTo).toBe("signature");
    expect(c.callbackForm.upgradeTo).toBe("signature");
  });

  it("allows Pro to edit advanced public content except Signature-only features", () => {
    const c = getClientFicheCapabilities("pro");
    expect(c.profile.editable).toBe(true);
    expect(c.presentation.editable).toBe(true);
    expect(c.rendezVous.editable).toBe(true);
    expect(c.socials.editable).toBe(true);
    expect(c.links.maxItems).toBe(10);
    expect(c.gallery.maxItems).toBe(4);\n    expect(c.gallery.maxVideos).toBe(1);
    expect(c.googleReview.editable).toBe(true);
    expect(c.catalog.editable).toBe(false);
    expect(c.catalog.upgradeTo).toBe("signature");
    expect(c.callbackForm.upgradeTo).toBe("signature");
  });

  it("derives quantitative limits from plan features", () => {
    for (const plan of ["essentiel", "pro", "signature"] as const) {
      const capabilities = getClientFicheCapabilities(plan);
      const features = getPlanFeatures(plan);
      expect(capabilities.links.maxItems).toBe(features.maxLinks);
      expect(capabilities.gallery.maxItems).toBe(features.maxPhotos);\n      expect(capabilities.gallery.maxVideos).toBe(features.maxVideos);
    }
  });

  it("allows Signature to edit the complete public content", () => {
    const c = getClientFicheCapabilities("signature");
    for (const key of Object.keys(c) as Array<keyof typeof c>) {
      expect(c[key].editable).toBe(true);
    }
  });
});
