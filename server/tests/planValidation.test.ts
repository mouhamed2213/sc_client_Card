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
      essentiel: { maxLinks: 0, maxPhotos: 0, maxVideos: 0, hasForm: false, hasGoogleReview: false, requiresProfile: false, requiresHours: true, hasCatalog: false, maxCatalogSections: 0, maxCatalogArticlesPerSection: 0, hasPanel: false },
      pro: { maxLinks: 10, maxPhotos: 4, maxVideos: 1, hasForm: false, hasGoogleReview: true, requiresProfile: true, requiresHours: true, hasCatalog: true, maxCatalogSections: 2, maxCatalogArticlesPerSection: 12, hasPanel: false },
      signature: { maxLinks: 10, maxPhotos: 8, maxVideos: 3, hasForm: true, hasGoogleReview: true, requiresProfile: true, requiresHours: true, hasCatalog: true, maxCatalogSections: 6, maxCatalogArticlesPerSection: 12, hasPanel: true },
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

  it("allows Pro features, including a catalogue within its own limit", () => {
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
        galerie: items(4),
        liens: items(10),
        rendezVous: { label: "RDV", url: "https://cal.com/x" },
        reseauxSociaux: [{ label: "Instagram", url: "https://instagram.com/x" }],
        sections: [{ titre: "Menu", articles: items(12) }],
      },
    });
    expect(validPro).toEqual([]);
    expect(getPlanFeatures("pro").hasForm).toBe(false);
  });

  it("caps the catalogue: Pro at 2 sections, Signature at 6, both at 12 articles per section", () => {
    const proTooManySections = validatePlanPayload({
      formule: "pro",
      ...base,
      photo: "/portrait.webp",
      logo: "/logo.webp",
      data: {
        ...base.data,
        horaires: hours,
        sections: Array.from({ length: 3 }, (_, i) => ({ titre: `Section ${i}`, articles: [] })),
      },
    });
    expect(proTooManySections).toContain("pro: maximum 2 sections de catalogue.");

    const signatureTooManySections = validatePlanPayload({
      formule: "signature",
      ...base,
      photo: "/portrait.webp",
      logo: "/logo.webp",
      data: {
        ...base.data,
        horaires: hours,
        sections: Array.from({ length: 7 }, (_, i) => ({ titre: `Section ${i}`, articles: [] })),
      },
    });
    expect(signatureTooManySections).toContain("signature: maximum 6 sections de catalogue.");

    const tooManyArticles = validatePlanPayload({
      formule: "signature",
      ...base,
      photo: "/portrait.webp",
      logo: "/logo.webp",
      data: {
        ...base.data,
        horaires: hours,
        sections: [{ titre: "Menu", articles: items(13) }],
      },
    });
    expect(tooManyArticles).toContain("signature: maximum 12 articles par section.");

    const proWithinLimits = validatePlanPayload({
      formule: "pro",
      ...base,
      photo: "/portrait.webp",
      logo: "/logo.webp",
      data: {
        ...base.data,
        horaires: hours,
        sections: Array.from({ length: 2 }, (_, i) => ({ titre: `Section ${i}`, articles: items(12) })),
      },
    });
    expect(proWithinLimits).toEqual([]);

    const signatureWithinLimits = validatePlanPayload({
      formule: "signature",
      ...base,
      photo: "/portrait.webp",
      logo: "/logo.webp",
      data: {
        ...base.data,
        horaires: hours,
        sections: Array.from({ length: 6 }, (_, i) => ({ titre: `Section ${i}`, articles: items(12) })),
      },
    });
    expect(signatureWithinLimits).toEqual([]);
  });

  it("enforces Pro and Signature media limits", () => {
    const proErrors = validatePlanPayload({
      formule: "pro",
      ...base,
      photo: "/portrait.webp",
      logo: "/logo.webp",
      data: { ...base.data, horaires: hours, galerie: items(5), liens: items(11) },
    });
    expect(proErrors).toContain("pro: maximum 10 liens.");
    expect(proErrors).toContain("pro: maximum 4 photos.");

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

  it("enforces video limits independently from photo limits", () => {
    const proErrors = validatePlanPayload({
      formule: "pro",
      ...base,
      photo: "/portrait.webp",
      logo: "/logo.webp",
      data: {
        ...base.data,
        horaires: hours,
        galerie: [
          { type: "image", url: "/1.webp", alt: "" },
          { type: "image", url: "/2.webp", alt: "" },
          { type: "image", url: "/3.webp", alt: "" },
          { type: "image", url: "/4.webp", alt: "" },
          { type: "video", url: "https://www.youtube.com/watch?v=abcDEF_123", alt: "" },
          { type: "video", url: "https://www.youtube.com/shorts/abcDEF_123", alt: "" },
        ],
      },
    });
    expect(proErrors).toContain("pro: maximum 1 vidéos.");

    const signatureErrors = validatePlanPayload({
      formule: "signature",
      ...base,
      photo: "/portrait.webp",
      logo: "/logo.webp",
      data: {
        ...base.data,
        horaires: hours,
        galerie: [
          { type: "video", url: "https://www.youtube.com/watch?v=abcDEF_123", alt: "" },
          { type: "video", url: "https://vimeo.com/123456789", alt: "" },
          { type: "video", url: "https://www.tiktok.com/@user/video/1234567890123456789", alt: "" },
          { type: "video", url: "https://www.youtube.com/watch?v=abcDEF_123", alt: "" },
        ],
      },
    });
    expect(signatureErrors).toContain("signature: maximum 3 vidéos.");
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
