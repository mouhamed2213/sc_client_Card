import { describe, expect, it } from "vitest";
import {
  CLIENT_USERNAME_PATTERN,
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
