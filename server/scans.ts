/**
 * "Passages" (scans): a passage is a real visitor opening a fiche through the
 * physical card (NFC tap) or its QR code. Everything below exists to keep that
 * number honest — see docs/passages.md for the rules and the rationale.
 */
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createHash } from "node:crypto";
import { ENV } from "./_core/env";
import { recordScanEvent } from "./database/db";
import type { Fiche, User } from "./database/generated/prisma/client";
import { isFichePubliclyAccessible } from "./module/admin/ficheLifecycle";

export const SCAN_SOURCES = ["qr", "nfc"] as const;
export type ScanSource = (typeof SCAN_SOURCES)[number];

/** The same visitor re-opening the same fiche inside this window is one passage. */
export const SCAN_DEDUP_WINDOW_MS = 30 * 60 * 1000;

export type ScanSkipReason =
  | "not_active"
  | "staff"
  | "owner"
  | "preview"
  | "bot"
  | "missing_source"
  | "rate_limited"
  | "duplicate";

export type ScanResult =
  | { ok: true; counted: true; source: ScanSource }
  | { ok: true; counted: false; reason: ScanSkipReason };

export type ScanInput = {
  slug: string;
  source?: ScanSource;
  visitorId?: string;
  preview?: boolean;
};

/** Crawlers, link-preview fetchers, headless browsers and scripted HTTP clients. */
const BOT_USER_AGENT =
  /bot\b|crawl|spider|slurp|facebookexternalhit|facebot|whatsapp\/|telegrambot|slackbot|discordbot|linkedinbot|twitterbot|embedly|headless|lighthouse|pagespeed|curl\/|wget\/|python-requests|python-urllib|go-http-client|node-fetch|axios\/|okhttp\/|libwww|httpclient|uptime|pingdom|monitor/i;

/** A real browser always sends a user agent: an empty one is a script. */
export function isBotUserAgent(userAgent: string | undefined | null) {
  const value = (userAgent ?? "").trim();
  return value.length === 0 || BOT_USER_AGENT.test(value);
}

export function clientIp(req: CreateExpressContextOptions["req"]) {
  const forwarded = req.headers?.["x-forwarded-for"];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)
    ?.split(",")[0]
    ?.trim();
  return first || req.ip || req.socket?.remoteAddress || "unknown";
}

/**
 * Anonymous visitor key: a keyed hash, never the raw id / IP / user agent.
 * Without a browser-provided id we fall back to IP + user agent.
 */
export function visitorKey(
  visitorId: string | undefined,
  ip: string,
  userAgent: string
) {
  const material = visitorId ? `id:${visitorId}` : `ip:${ip}|ua:${userAgent}`;
  return createHash("sha256")
    .update(`${ENV.cookieSecret}|scan|${material}`)
    .digest("hex")
    .slice(0, 40);
}

/* -------- flood guard: at most N counted-scan attempts per IP + fiche -------- */
const RATE_LIMIT = 40;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map<string, number[]>();

export function allowScanAttempt(key: string, now = Date.now()) {
  const recent = (attempts.get(key) ?? []).filter(
    t => now - t < RATE_WINDOW_MS
  );
  if (recent.length >= RATE_LIMIT) {
    attempts.set(key, recent);
    return false;
  }
  recent.push(now);
  attempts.set(key, recent);
  if (attempts.size > 5000) {
    attempts.forEach((times, k) => {
      if (times.every(t => now - t >= RATE_WINDOW_MS)) attempts.delete(k);
    });
  }
  return true;
}

export function resetScanRateLimit() {
  attempts.clear();
}

/**
 * Decides whether a hit on a public fiche is a passage and, if so, records it
 * atomically (event + total + daily aggregate). Never throws for an expected
 * refusal: the public page must keep working whatever happens here.
 */
export async function handleScan(args: {
  fiche: Fiche | null | undefined;
  user: User | null | undefined;
  req: CreateExpressContextOptions["req"];
  input: ScanInput;
}): Promise<ScanResult> {
  const { fiche, user, req, input } = args;
  const skip = (reason: ScanSkipReason): ScanResult => ({
    ok: true,
    counted: false,
    reason,
  });

  // Suspended, deleted, draft and expired fiches are not publicly visible.
  if (!fiche || !isFichePubliclyAccessible(fiche)) return skip("not_active");
  // Staff and the fiche's own owner looking at their page are not passages.
  if (user?.role === "admin") return skip("staff");
  if (user && fiche.ownerId === user.id) return skip("owner");
  if (input.preview) return skip("preview");

  const userAgent = String(req.headers?.["user-agent"] ?? "");
  if (isBotUserAgent(userAgent)) return skip("bot");
  // A passage is exclusively a QR/NFC arrival. A direct URL is never a passage.
  if (!input.source || !SCAN_SOURCES.includes(input.source)) {
    return skip("missing_source");
  }

  const ip = clientIp(req);
  if (!allowScanAttempt(`${ip}|${fiche.id}`)) return skip("rate_limited");

  const counted = await recordScanEvent(fiche, {
    visitorKey: visitorKey(input.visitorId, ip, userAgent),
    source: input.source,
    windowMs: SCAN_DEDUP_WINDOW_MS,
  });
  return counted
    ? { ok: true, counted: true, source: input.source }
    : skip("duplicate");
}
