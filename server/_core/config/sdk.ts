import { ForbiddenError } from "@shared/_core/errors";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../../server/database/generated/prisma/client";
import * as db from "../../database/db";
import { ENV } from "../env";

// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  userId: number;
  name: string;
};

/**
 * Signs/verifies our own session JWTs and resolves the authenticated user
 * for a request. This layer is provider-agnostic: it doesn't know or care
 * Local client/admin authentication uses User.id directly. Legacy OAuth
 * identity data is supported only while the migration is in progress.
 */
class SDKServer {
  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    if (!secret) {
      throw new Error(
        "[Auth] JWT_SECRET is not configured — cannot sign/verify sessions."
      );
    }
    return new TextEncoder().encode(secret);
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  /**
   * Create a session token for the canonical database `User.id`.
   * @example
   * const sessionToken = await sdk.createSessionToken(userId, { name });
   */
  async createSessionToken(
    userId: number,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession({ userId, name: options.name || "" }, options);
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      userId: payload.userId,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ userId: number; name: string } | null> {
    if (!cookieValue) return null;
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { userId, openId, name } = payload as Record<string, unknown>;
      if (
        typeof userId === "number" &&
        Number.isSafeInteger(userId) &&
        userId > 0
      ) {
        return { userId, name: isNonEmptyString(name) ? name : "" };
      }
      // Temporary compatibility for sessions issued before the User.id migration.
      if (isNonEmptyString(openId)) {
        const legacyUser = await db.getUserByLegacyOpenId(openId);
        if (!legacyUser) return null;
        return {
          userId: legacyUser.id,
          name: isNonEmptyString(name) ? name : (legacyUser.name ?? ""),
        };
      }
      return null;
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<User> {
    // 1. Prefer the session cookie (regular OAuth/admin login).
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);

    // 2. Fallback to the Authorization header, used when the browser blocks
    //    first-party cookies (Safari ITP, private browsing, some WebViews).
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }

    const session = await this.verifySession(sessionToken);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const signedInAt = new Date();
    const user = await db.getUserById(session.userId);
    if (!user) throw ForbiddenError("User not found — please sign in again");
    await db.updateUserLastSignedIn(user.id, signedInAt);

    return user;
  }
}

export const sdk = new SDKServer();
