import { COOKIE_NAME } from "@shared/const";
import type { Express, Request } from "express";
import { z } from "zod";
import { prisma } from "../../prisma/client";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { verifyClientPassword } from "./clientAuth";

const loginSchema = z.object({
  username: z.string().trim().min(3).max(64),
  password: z.string().min(1).max(200),
});

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const failures = new Map<string, { count: number; resetAt: number }>();

function getClientKey(req: Request, username: string): string {
  return `${req.ip || req.socket.remoteAddress || "unknown"}:${username.toLowerCase()}`;
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

export function registerClientRoutes(app: Express): void {
  app.post("/api/client/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: "Identifiants invalides." });
    }

    const { username, password } = parsed.data;
    const key = getClientKey(req, username);

    if (isRateLimited(key)) {
      return res.status(429).json({
        message: "Trop de tentatives. Réessayez plus tard.",
      });
    }

    if (!ENV.cookieSecret) {
      return res.status(500).json({
        message: "Le serveur d'authentification n'est pas configuré.",
      });
    }

    const credential = await prisma.clientCredential.findUnique({
      where: { username },
      include: { user: true },
    });

    if (
      !credential ||
      credential.user.role !== "user" ||
      !verifyClientPassword(password, credential.passwordHash)
    ) {
      recordFailure(key);
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    await prisma.user.update({
      where: { id: credential.userId },
      data: {
        lastSignedIn: new Date(),
        loginMethod: "local-client",
      },
    });

    const sessionToken = await sdk.createSessionToken(credential.user.openId, {
      expiresInMs: 365 * 24 * 60 * 60 * 1000,
      name: credential.user.name || username,
    });

    res.cookie(COOKIE_NAME, sessionToken, {
      ...getSessionCookieOptions(req),
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });

    clearFailures(key);

    return res.json({
      success: true,
      mustChangePassword: credential.mustChangePassword,
    });
  });
}
