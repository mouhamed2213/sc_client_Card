import { describe, expect, it } from "vitest";
import { getPlanFeatures, planFeatures } from "@shared/planFeatures";
import { validatePlanPayload } from "../planValidation";

const base = {
  photo: "",
  logo: "",
  googlePlaceId: "",
  data: { liens: [], galerie: [], horaires: [], sections: [] },
};
const items = (count: number) => Array.from({ length: count }, () => ({}));
const hours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map(jour => ({
  jour,
  horaire: jour === "Dimanche" ? "Fermé" : "09:00 — 18:00",
}));
const validSignatureData = {
  photo: "/portrait.webp",
  logo: "",
  googlePlaceId: "ChIJ-valid",
  data: { liens: items(10), galerie: items(8), horaires: hours, sections: [{ titre: "Menu" }] },
};

describe("planFeatures architecture", () => {
  it("declares the exact capabilities of the three formulas", () => {
    expect(planFeatures).toEqual({
      essentiel: { maxLinks: 3, maxPhotos: 0, hasForm: false, hasGoogleReview: false, requiresProfile: false, requiresHours: true, hasCatalog: false },
      pro: { maxLinks: 10, maxPhotos: 8, hasForm: true, hasGoogleReview: true, requiresProfile: true, requiresHours: true, hasCatalog: false },
      signature: { maxLinks: 10, maxPhotos: 8, hasForm: true, hasGoogleReview: true, requiresProfile: true, requiresHours: true, hasCatalog: true },
    });
  });

  it("Essentiel requires seven days, accepts three links and rejects gallery photos", () => {
    expect(validatePlanPayload({ formule: "essentiel", ...base, data: { ...base.data, horaires: hours, liens: items(3) } })).toEqual([]);
    expect(validatePlanPayload({ formule: "essentiel", ...base, data: { ...base.data, horaires: hours, liens: items(4), galerie: items(1) } })).toEqual([
      "essentiel: maximum 3 liens.",
      "La formule Essentiel ne permet pas de galerie photo.",
    ]);
    expect(getPlanFeatures("essentiel").hasForm).toBe(false);
  });

  it("Pro requires a portrait or logo, Google Place ID and seven days, with up to eight photos", () => {
    expect(validatePlanPayload({ formule: "pro", ...base, data: { ...base.data, horaires: hours } })).toEqual([
      "pro: un portrait ou un logo est obligatoire.",
      "pro: google_place_id est obligatoire pour l'avis Google.",
    ]);
    expect(validatePlanPayload({ formule: "pro", photo: "/portrait.webp", googlePlaceId: "ChIJ-valid", data: { ...base.data, horaires: hours, galerie: items(8), liens: items(10) } })).toEqual([]);
    expect(validatePlanPayload({ formule: "pro", photo: "/portrait.webp", googlePlaceId: "ChIJ-valid", data: { ...base.data, horaires: hours, galerie: items(9) } })).toContain("pro: maximum 8 photos.");
    expect(getPlanFeatures("pro").hasForm).toBe(true);
  });

  it("Signature inherits Pro capabilities and adds catalog", () => {
    expect(validatePlanPayload({ formule: "signature", ...validSignatureData })).toEqual([]);
    expect(validatePlanPayload({ formule: "signature", ...validSignatureData, data: { ...validSignatureData.data, galerie: items(9) } })).toContain("signature: maximum 8 photos.");
    expect(validatePlanPayload({ formule: "signature", ...validSignatureData, data: { ...validSignatureData.data, sections: [] } })).toContain("signature: au moins une section de catalogue est obligatoire.");
  });

  it("Signature rejects missing Google Place ID and incomplete hours", () => {
    const errors = validatePlanPayload({ formule: "signature", ...validSignatureData, googlePlaceId: "", data: { ...validSignatureData.data, horaires: [{ jour: "Lundi", horaire: "Fermé" }] } });
    expect(errors).toEqual(expect.arrayContaining([
      "signature: google_place_id est obligatoire pour l'avis Google.",
      "signature: les horaires doivent couvrir exactement les 7 jours.",
    ]));
  });
});
