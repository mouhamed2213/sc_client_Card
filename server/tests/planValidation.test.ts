import { describe, expect, it } from "vitest";
import { getPlanFeatures, planFeatures } from "@shared/planFeatures";
import { validatePlanPayload } from "../planValidation";

const base = {
  photo: "",
  logo: "",
  googlePlaceId: "",
  site: "",
  data: { liens: [], galerie: [], horaires: [], sections: [] },
};
const items = (count: number) => Array.from({ length: count }, () => ({}));
const hours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map(jour => ({
  jour,
  horaire: jour === "Dimanche" ? "Fermé" : "09:00 — 18:00",
}));

describe("planFeatures architecture", () => {
  it("declares the exact capabilities of the three formulas", () => {
    expect(planFeatures).toEqual({
      essentiel: { maxLinks: 0, maxPhotos: 0, hasForm: false, hasGoogleReview: false, requiresProfile: false, requiresHours: true, hasCatalog: false, hasPanel: false },
      pro: { maxLinks: 10, maxPhotos: 8, hasForm: false, hasGoogleReview: true, requiresProfile: true, requiresHours: true, hasCatalog: false, hasPanel: false },
      signature: { maxLinks: 10, maxPhotos: 8, hasForm: true, hasGoogleReview: true, requiresProfile: true, requiresHours: true, hasCatalog: true, hasPanel: true },
    });
  });

  it("rejects Pro and Signature-only content for Essentiel", () => {
    const errors = validatePlanPayload({
      formule: "essentiel",
      ...base,
      site: "https://example.com",
      googlePlaceId: "ChIJ-valid",
      data: {
        ...base.data,
        horaires: hours,
        liens: items(1),
        galerie: items(1),
        rendezVous: { label: "RDV", url: "https://cal.com/x" },
        reseauxSociaux: [{ label: "Instagram", url: "https://instagram.com/x" }],
        sections: [{ titre: "Menu" }],
      },
    });
    expect(errors).toEqual(expect.arrayContaining([
      "Cette formule ne permet pas de site internet.",
      "Cette formule ne permet pas de liens personnalisés.",
      "Cette formule ne permet pas de galerie photo.",
      "Cette formule ne permet pas de prise de rendez-vous.",
      "Cette formule ne permet pas de réseaux sociaux.",
      "Cette formule ne permet pas les avis Google.",
      "Cette formule ne permet pas de catalogue.",
    ]));
    expect(getPlanFeatures("essentiel").hasForm).toBe(false);
  });

  it("allows Pro features and rejects Signature-only catalog", () => {
    const validPro = validatePlanPayload({
      formule: "pro",
      ...base,
      photo: "/portrait.webp",
      logo: "/logo.webp",
      googlePlaceId: "ChIJ-valid",
      site: "https://example.com",
      data: {
        ...base.data,
        horaires: hours,
        galerie: items(8),
        liens: items(10),
        rendezVous: { label: "RDV", url: "https://cal.com/x" },
        reseauxSociaux: [{ label: "Instagram", url: "https://instagram.com/x" }],
      },
    });
    expect(validPro).toEqual([]);
    expect(getPlanFeatures("pro").hasForm).toBe(false);

    const proWithCatalog = validatePlanPayload({
      formule: "pro",
      ...base,
      photo: "/portrait.webp",
      logo: "/logo.webp",
      data: { ...base.data, horaires: hours, sections: [{ titre: "Menu" }] },
    });
    expect(proWithCatalog).toContain("Cette formule ne permet pas de catalogue.");
  });

  it("enforces Pro and Signature media limits", () => {
    const proErrors = validatePlanPayload({
      formule: "pro",
      ...base,
      photo: "/portrait.webp",
      logo: "/logo.webp",
      data: { ...base.data, horaires: hours, galerie: items(9), liens: items(11) },
    });
    expect(proErrors).toContain("pro: maximum 10 liens.");
    expect(proErrors).toContain("pro: maximum 8 photos.");

    const signatureErrors = validatePlanPayload({
      formule: "signature",
      ...base,
      photo: "/portrait.webp",
      logo: "/logo.webp",
      data: { ...base.data, horaires: hours, galerie: items(9), liens: items(11) },
    });
    expect(signatureErrors).toContain("signature: maximum 10 liens.");
    expect(signatureErrors).toContain("signature: maximum 8 photos.");
  });

  it("accepts the full Signature feature set", () => {
    expect(validatePlanPayload({
      formule: "signature",
      ...base,
      photo: "/portrait.webp",
      logo: "/logo.webp",
      googlePlaceId: "ChIJ-valid",
      site: "https://example.com",
      data: {
        ...base.data,
        horaires: hours,
        liens: items(10),
        galerie: items(8),
        rendezVous: { label: "RDV", url: "https://cal.com/x" },
        reseauxSociaux: [{ label: "Instagram", url: "https://instagram.com/x" }],
        sections: [{ titre: "Menu" }],
      },
    })).toEqual([]);
  });

  it("validates incomplete hours", () => {
    const errors = validatePlanPayload({
      formule: "signature",
      ...base,
      photo: "/portrait.webp",
      logo: "/logo.webp",
      data: { ...base.data, horaires: [{ jour: "Lundi", horaire: "Fermé" }] },
    });
    expect(errors).toContain("signature: les horaires doivent couvrir exactement les 7 jours.");
  });
});
