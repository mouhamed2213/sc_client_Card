import { describe, expect, it } from "vitest";
import { validatePlanPayload } from "@shared/planValidation";

// The studio decides "activate now" vs "draft" from these exact rules when an
// admin picks a plan while creating a client account.
const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const hours = days.map(jour => ({ jour, horaire: "Sur rendez-vous" }));
const data = { liens: [], galerie: [], horaires: hours, sections: [] };

describe("plan choice at account creation", () => {
  it("Essentiel can be activated with the default 7-day hours only", () => {
    expect(
      validatePlanPayload({ formule: "essentiel", photo: "", logo: "", googlePlaceId: "", site: "", data })
    ).toEqual([]);
  });

  it("Pro needs a portrait or logo and a Google Place ID to be activated", () => {
    const missing = validatePlanPayload({ formule: "pro", photo: "", logo: "", googlePlaceId: "", site: "", data });
    expect(missing).toHaveLength(2);
    expect(
      validatePlanPayload({ formule: "pro", photo: "/p.webp", logo: "", googlePlaceId: "ChIJ-x", site: "", data })
    ).toEqual([]);
  });

  it("Signature stays a draft until a catalogue section exists", () => {
    const base = { formule: "signature" as const, photo: "/p.webp", logo: "", googlePlaceId: "ChIJ-x", site: "" };
    expect(validatePlanPayload({ ...base, data })).toEqual([
      "signature: au moins une section de catalogue est obligatoire.",
    ]);
    expect(
      validatePlanPayload({ ...base, data: { ...data, sections: [{ titre: "Menu" }] } })
    ).toEqual([]);
  });

  it("rejects an incomplete week of hours for every plan", () => {
    const short = { ...data, horaires: hours.slice(0, 3) };
    expect(
      validatePlanPayload({ formule: "pro", photo: "/p.webp", logo: "", googlePlaceId: "ChIJ-x", site: "", data: short })
    ).toContain("pro: les horaires doivent couvrir exactement les 7 jours.");
  });
});
