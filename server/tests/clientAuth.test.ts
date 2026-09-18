import { describe, expect, it } from "vitest";
import {
  CLIENT_USERNAME_PATTERN,
  generateClientUsername,
  generateTemporaryClientPassword,
  hashClientPassword,
  verifyClientPassword,
} from "../_core/clientAuth";

describe("client authentication primitives", () => {
  it("hashes passwords without storing the clear text", () => {
    const password = "Essentiel-Client-2026!";
    const hash = hashClientPassword(password);

    expect(hash).not.toContain(password);
    expect(hash.split("$")).toHaveLength(6);
    expect(verifyClientPassword(password, hash)).toBe(true);
    expect(verifyClientPassword("wrong-password", hash)).toBe(false);
  });

  it("uses a fresh salt for each password hash", () => {
    const password = "Essentiel-Client-2026!";

    expect(hashClientPassword(password)).not.toBe(hashClientPassword(password));
  });

  it("accepts only the supported username format", () => {
    expect(CLIENT_USERNAME_PATTERN.test("client.essentiel")).toBe(true);
    expect(CLIENT_USERNAME_PATTERN.test("client_2026")).toBe(true);
    expect(CLIENT_USERNAME_PATTERN.test("ab")).toBe(false);
    expect(CLIENT_USERNAME_PATTERN.test("client name")).toBe(false);
  });
});


describe("generated client credentials", () => {
  it("generates a valid unique-looking username", () => {
    const username = generateClientUsername("Mouhamed Xumaa");

    expect(CLIENT_USERNAME_PATTERN.test(username)).toBe(true);
    expect(username.startsWith("mouhamed.xumaa-")).toBe(true);
    expect(username.length).toBeLessThanOrEqual(42);
  });

  it("generates a temporary password that is never the stored hash", () => {
    const password = generateTemporaryClientPassword();
    const hash = hashClientPassword(password);

    expect(password.length).toBeGreaterThanOrEqual(16);
    expect(hash).not.toContain(password);
    expect(verifyClientPassword(password, hash)).toBe(true);
  });
});
