import { COOKIE_NAME } from "@shared/const";
import type { Express, Request } from "express";
import { z } from "zod";
import { prisma } from "../../database/prisma/client";
import { sdk } from "../../_core/config/sdk";
import { getAdminSessionCookieOptions } from "../../_core/cookies";
import { ENV } from "../../_core/env";
import { verifyAdminPassword } from "../auth/adminAuth";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(200),
});

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const failures = new Map<string, { count: number; resetAt: number }>();

function getClientKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function isRateLimited(key: string): boolean {
  const state = failures.get(key);
  if (!state) return false;
  if (Date.now() >= state.resetAt) {
    failures.delete(key);
    return false;
  }
  return state.count >= MAX_FAILURES;
}

function recordFailure(key: string): void {
  const now = Date.now();
  const state = failures.get(key);

  if (!state || now >= state.resetAt) {
    failures.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  state.count += 1;
}

function clearFailures(key: string): void {
  failures.delete(key);
}

function adminCookieOptions(req: Request) {
  return getAdminSessionCookieOptions(req);
}

export function registerAdminRoutes(app: Express): void {
  app.post("/api/admin/login", async (req, res) => {
    const key = getClientKey(req);

    if (isRateLimited(key)) {
      return res.status(429).json({
        message: "Trop de tentatives. Réessayez plus tard.",
      });
    }

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      recordFailure(key);
      return res.status(400).json({ message: "Identifiants invalides." });
    }

    const { username, password } = parsed.data;

    if (!ENV.cookieSecret) {
      return res.status(500).json({
        message: "Le serveur d'authentification n'est pas configuré.",
      });
    }

    const credential = await prisma.adminCredential.findUnique({
      where: { username },
      include: { user: true },
    });

    if (
      !credential ||
      credential.user.role !== "admin" ||
      !verifyAdminPassword(password, credential.passwordHash)
    ) {
      recordFailure(key);
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    await prisma.user.update({
      where: { id: credential.userId },
      data: { lastSignedIn: new Date() },
    });

    const sessionToken = await sdk.createSessionToken(credential.user.id, {
      expiresInMs: 8 * 60 * 60 * 1000,
      name: credential.user.name || credential.username,
    });

    res.cookie(COOKIE_NAME, sessionToken, {
      ...adminCookieOptions(req),
      maxAge: 8 * 60 * 60 * 1000,
    });

    clearFailures(key);
    return res.json({ success: true, username: credential.username });
  });

  app.post("/api/admin/logout", (req, res) => {
    res.clearCookie(COOKIE_NAME, {
      ...adminCookieOptions(req),
      maxAge: -1,
    });
    return res.json({ success: true });
  });
}


// ROUTER 
// export const authRouter = router