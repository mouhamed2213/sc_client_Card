import { describe, expect, it } from "vitest";
import { hashClientPassword } from "../_core/clientAuth";

describe("client account creation contract", () => {
  it("produces a password hash suitable for a transactional client account", () => {
    const hash = hashClientPassword("Temporary-Essentiel-2026!");
    expect(hash.startsWith("scrypt$")).toBe(true);
  });
});
