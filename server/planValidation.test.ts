import { describe, expect, it } from "vitest";
import { validatePlanPayload } from "./planValidation";

const base = { photo: "", logo: "", googlePlaceId: "", data: { liens: [], galerie: [], horaires: [], sections: [] } };

describe("planFeatures validation", () => {
  it("accepts Essentiel with three links and no photos", () => {
    expect(validatePlanPayload({ formule: "essentiel", ...base, data: { ...base.data, liens: [{}, {}, {}] } })).toEqual([]);
  });

  it("rejects Essentiel photos and a fourth link", () => {
    const errors = validatePlanPayload({ formule: "essentiel", ...base, data: { ...base.data, liens: [{}, {}, {}, {}], galerie: [{}] } });
    expect(errors).toHaveLength(2);
  });

  it("requires a profile for Pro and limits its gallery to three", () => {
    const errors = validatePlanPayload({ formule: "pro", ...base, data: { ...base.data, galerie: [{}, {}, {}, {}] } });
    expect(errors).toEqual(expect.arrayContaining([expect.stringContaining("portrait"), expect.stringContaining("maximum 3")]));
  });

  it("requires the Google place id, seven days and a catalog for Commerce", () => {
    const errors = validatePlanPayload({ formule: "commerce", ...base, photo: "/photo.webp", data: { ...base.data, horaires: [{ jour: "Lundi", horaire: "Fermé" }] } });
    expect(errors).toEqual(expect.arrayContaining([expect.stringContaining("google_place_id"), expect.stringContaining("7 jours"), expect.stringContaining("catalogue")]));
  });
});
