import { describe, expect, it } from "vitest";
import { hashAdminPassword, verifyAdminPassword } from "../_core/adminAuth";

describe("admin password authentication", () => {
  it("verifies a generated password hash", () => {
    const hash = hashAdminPassword("correct-password");

    expect(verifyAdminPassword("correct-password", hash)).toBe(true);
    expect(verifyAdminPassword("wrong-password", hash)).toBe(false);
  });

  it("rejects malformed hashes", () => {
    expect(verifyAdminPassword("anything", "invalid-hash")).toBe(false);
  });
});
