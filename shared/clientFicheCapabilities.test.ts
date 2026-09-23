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
    expect(c.socials.upgradeTo).toBe("pro");
    expect(c.links.editable).toBe(false);
    expect(c.gallery.editable).toBe(false);
    expect(c.googleReview.upgradeTo).toBe("pro");
    expect(c.catalog.upgradeTo).toBe("pro");
    expect(c.callbackForm.upgradeTo).toBe("signature");
  });

  it("allows Pro to edit advanced public content except Signature-only features", () => {
    const c = getClientFicheCapabilities("pro");
    expect(c.profile.editable).toBe(true);
    expect(c.presentation.editable).toBe(true);
    expect(c.socials.editable).toBe(true);
    expect(c.links.maxItems).toBe(10);
    expect(c.gallery.maxItems).toBe(4);
    expect(c.gallery.maxVideos).toBe(1);
    expect(c.googleReview.editable).toBe(true);
    // Catalogue is shared with Pro but with a tighter section cap (Signature keeps more room).
    expect(c.catalog.editable).toBe(true);
    expect(c.catalog.maxSections).toBe(2);
    expect(c.catalog.maxArticlesPerSection).toBe(12);
    expect(c.callbackForm.upgradeTo).toBe("signature");
  });

  it("derives quantitative limits from plan features", () => {
    for (const plan of ["essentiel", "pro", "signature"] as const) {
      const capabilities = getClientFicheCapabilities(plan);
      const features = getPlanFeatures(plan);
      expect(capabilities.links.maxItems).toBe(features.maxLinks);
      expect(capabilities.gallery.maxItems).toBe(features.maxPhotos);
      expect(capabilities.gallery.maxVideos).toBe(features.maxVideos);
    }
    // Pro's catalogue is capped tighter than Signature's; both share the
    // 12-articles-per-section limit.
    expect(getClientFicheCapabilities("pro").catalog.maxSections).toBe(2);
    expect(getClientFicheCapabilities("signature").catalog.maxSections).toBe(6);
    expect(getClientFicheCapabilities("pro").catalog.maxArticlesPerSection).toBe(
      getClientFicheCapabilities("signature").catalog.maxArticlesPerSection
    );
  });

  it("allows Signature to edit the complete public content", () => {
    const c = getClientFicheCapabilities("signature");
    for (const key of Object.keys(c) as Array<keyof typeof c>) {
      expect(c[key].editable).toBe(true);
    }
  });
});
