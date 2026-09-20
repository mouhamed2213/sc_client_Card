import { describe, expect, it } from "vitest";
import { pickAvailableSlug, slugBaseFromFiche, slugify } from "./slug";

describe("slug generation", () => {
  it("removes accents, spaces and symbols", () => {
    expect(slugify("  Élodie  N'Diaye ")).toBe("elodie-n-diaye");
  });

  it("builds the base from the name, then the company, then a fallback", () => {
    expect(slugBaseFromFiche({ prenom: "Marie", nom: "Diallo" })).toBe("marie-diallo");
    expect(slugBaseFromFiche({ prenom: "", nom: "", entreprise: "Hôtel Teranga" })).toBe("hotel-teranga");
    expect(slugBaseFromFiche({})).toBe("fiche");
    expect(slugBaseFromFiche({ prenom: "A", nom: "" })).toBe("a-fiche");
  });

  it("never returns a slug that is already taken", () => {
    expect(pickAvailableSlug("marie-diallo", [])).toBe("marie-diallo");
    expect(pickAvailableSlug("marie-diallo", ["marie-diallo"])).toBe("marie-diallo-2");
    expect(
      pickAvailableSlug("marie-diallo", ["marie-diallo", "marie-diallo-2", "marie-diallo-3"])
    ).toBe("marie-diallo-4");
  });
});
