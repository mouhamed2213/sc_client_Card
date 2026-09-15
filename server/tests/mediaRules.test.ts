import { describe, expect, it } from "vitest";
import { getOutputDimensions, mediaRules } from "@shared/mediaRules";

describe("media rules", () => {
  it("forces every portrait to a 400 by 400 square under 30 ko", () => {
    expect(getOutputDimensions("profile", 1600, 900)).toEqual({ width: 400, height: 400 });
    expect(mediaRules.profile.maxBytes).toBe(30 * 1024);
  });

  it("scales gallery images within 1200 px without enlargement", () => {
    expect(getOutputDimensions("gallery", 2400, 1600)).toEqual({ width: 1200, height: 800 });
    expect(getOutputDimensions("gallery", 600, 400)).toEqual({ width: 600, height: 400 });
    expect(mediaRules.gallery.maxBytes).toBe(80 * 1024);
  });

  it("limits logo height to 200 px while preserving its ratio", () => {
    expect(getOutputDimensions("logo", 800, 400)).toEqual({ width: 400, height: 200 });
  });
});
