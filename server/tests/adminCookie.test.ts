import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { getAdminSessionCookieOptions } from "../_core/cookies";

const req = (protocol: string, headers: Record<string, string> = {}) =>
  ({ protocol, headers }) as unknown as Request;

describe("admin session cookie", () => {
  it("is not Secure over plain HTTP, even with NODE_ENV=production", () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      expect(getAdminSessionCookieOptions(req("http")).secure).toBe(false);
    } finally {
      process.env.NODE_ENV = previous;
    }
  });

  it("is Secure over HTTPS, directly or behind a TLS proxy", () => {
    expect(getAdminSessionCookieOptions(req("https")).secure).toBe(true);
    expect(
      getAdminSessionCookieOptions(req("http", { "x-forwarded-proto": "https" }))
        .secure
    ).toBe(true);
  });

  it("stays httpOnly, SameSite=Lax and host-wide", () => {
    expect(getAdminSessionCookieOptions(req("https"))).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  });
});
