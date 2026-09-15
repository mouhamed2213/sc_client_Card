import { describe, expect, it } from "vitest";
import { getPlanFeatures, planFeatures } from "@shared/planFeatures";
import { validatePlanPayload } from "../planValidation";

const base = { photo: "", logo: "", googlePlaceId: "", data: { liens: [], galerie: [], horaires: [], sections: [] } };
const items = (count: number) => Array.from({ length: count }, () => ({}));
const hours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map(jour => ({ jour, horaire: jour === "Dimanche" ? "Fermé" : "09:00 — 18:00" }));

describe("planFeatures architecture", () => {
  it("declares the exact capabilities of all four plans", () => {
    expect(planFeatures).toEqual({
      essentiel: { maxLinks: 3, maxPhotos: 0, hasForm: false, hasGoogleReview: false, requiresProfile: false, requiresHours: false, hasCatalog: false },
      pro: { maxLinks: 10, maxPhotos: 3, hasForm: true, hasGoogleReview: false, requiresProfile: true, requiresHours: false, hasCatalog: false },
      signature: { maxLinks: 10, maxPhotos: 8, hasForm: true, hasGoogleReview: false, requiresProfile: true, requiresHours: false, hasCatalog: false },
      commerce: { maxLinks: 10, maxPhotos: 8, hasForm: true, hasGoogleReview: true, requiresProfile: true, requiresHours: true, hasCatalog: true },
    });
  });

  it("Essentiel accepts three links, rejects a fourth and rejects all gallery photos", () => {
    expect(validatePlanPayload({ formule: "essentiel", ...base, data: { ...base.data, liens: items(3) } })).toEqual([]);
    expect(validatePlanPayload({ formule: "essentiel", ...base, data: { ...base.data, liens: items(4), galerie: items(1) } })).toEqual([
      "essentiel: maximum 3 liens.",
      "La formule Essentiel ne permet pas de galerie photo.",
    ]);
    expect(getPlanFeatures("essentiel").hasForm).toBe(false);
  });

  it("Pro requires a portrait or logo, accepts three photos and rejects a fourth", () => {
    expect(validatePlanPayload({ formule: "pro", ...base, data: { ...base.data, galerie: items(3) } })).toContain("pro: un portrait ou un logo est obligatoire.");
    expect(validatePlanPayload({ formule: "pro", ...base, photo: "/portrait.webp", data: { ...base.data, galerie: items(3), liens: items(10) } })).toEqual([]);
    expect(validatePlanPayload({ formule: "pro", ...base, logo: "/logo.webp", data: { ...base.data, galerie: items(4) } })).toContain("pro: maximum 3 photos.");
    expect(getPlanFeatures("pro").hasForm).toBe(true);
  });

  it("Signature accepts eight photos and rejects a ninth", () => {
    expect(validatePlanPayload({ formule: "signature", ...base, photo: "/portrait.webp", data: { ...base.data, galerie: items(8), liens: items(10) } })).toEqual([]);
    expect(validatePlanPayload({ formule: "signature", ...base, photo: "/portrait.webp", data: { ...base.data, galerie: items(9) } })).toContain("signature: maximum 8 photos.");
  });

  it("Commerce accepts a complete payload with Google review, seven days, eight photos and catalog", () => {
    expect(validatePlanPayload({ formule: "commerce", ...base, photo: "/portrait.webp", googlePlaceId: "ChIJ-valid", data: { liens: items(10), galerie: items(8), horaires: hours, sections: [{ titre: "Menu" }] } })).toEqual([]);
  });

  it("Commerce rejects missing Google place id, incomplete hours and missing catalog", () => {
    const errors = validatePlanPayload({ formule: "commerce", ...base, photo: "/photo.webp", data: { ...base.data, horaires: [{ jour: "Lundi", horaire: "Fermé" }] } });
    expect(errors).toEqual(expect.arrayContaining([expect.stringContaining("google_place_id"), expect.stringContaining("7 jours"), expect.stringContaining("catalogue")]));
  });
});
