import { COOKIE_NAME } from "@shared/const";
import type { Express, Request } from "express";
import { z } from "zod";
import { parse as parseCookieHeader } from "cookie";
import { prisma } from "../../prisma/client";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { hashClientPassword, verifyClientPassword } from "./clientAuth";

const loginSchema = z.object({
  username: z.string().trim().min(3).max(64),
  password: z.string().min(1).max(200),
});

const passwordChangeSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères.")
    .max(200)
    .regex(/[A-Z]/, "Le nouveau mot de passe doit contenir une majuscule.")
    .regex(/[a-z]/, "Le nouveau mot de passe doit contenir une minuscule.")
    .regex(/[0-9]/, "Le nouveau mot de passe doit contenir un chiffre.")
    .regex(/[^A-Za-z0-9]/, "Le nouveau mot de passe doit contenir un caractère spécial."),
});

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
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

    const sessionToken = await sdk.createSessionToken(credential.user.id, {
      expiresInMs: SESSION_MAX_AGE_MS,
      name: credential.user.name || username,
    });

    res.cookie(COOKIE_NAME, sessionToken, {
      ...getSessionCookieOptions(req),
      maxAge: SESSION_MAX_AGE_MS,
    });

    clearFailures(key);

    return res.json({
      success: true,
      mustChangePassword: credential.mustChangePassword,
    });
  });

  app.post("/api/client/change-password", async (req, res) => {
    const parsed = passwordChangeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0]?.message ?? "Mot de passe invalide.",
      });
    }

    const cookies = parseCookieHeader(req.headers.cookie || "");
    const sessionToken = cookies[COOKIE_NAME];
    if (!sessionToken) {
      return res.status(401).json({ message: "Session requise." });
    }

    const session = await sdk.verifySession(sessionToken);
    if (!session) {
      return res.status(401).json({ message: "Session invalide." });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { clientCredential: true },
    });

    if (!user || user.role !== "user" || !user.clientCredential) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    if (!user.clientCredential.mustChangePassword) {
      return res.status(400).json({
        message: "Aucun changement de mot de passe obligatoire n'est en attente.",
      });
    }

    const key = getClientKey(req, user.clientCredential.username);
    if (isRateLimited(key)) {
      return res.status(429).json({
        message: "Trop de tentatives. Réessayez plus tard.",
      });
    }

    await prisma.clientCredential.update({
      where: { userId: user.id },
      data: {
        passwordHash: hashClientPassword(parsed.data.newPassword),
        mustChangePassword: false,
      },
    });

    clearFailures(key);
    return res.json({ success: true });
  });
}
