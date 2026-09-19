import {
  COOKIE_NAME,
  OAUTH_STATE_COOKIE,
  ONE_YEAR_MS,
  decodeOAuthState,
} from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { exchangeCodeForGoogleToken, getGoogleUserInfo } from "./googleAuth";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const googleError = getQueryParam(req, "error");

    if (googleError) {
      // e.g. user clicked "Cancel" on Google's consent screen.
      res.redirect(302, "/?login_error=" + encodeURIComponent(googleError));
      return;
    }

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // startLogin set in the browser that began this login. An attacker can
    // forge `state`, but cannot plant this cookie in the victim's browser.
    const { nonce, invitationToken } = decodeOAuthState(state);

    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[
      OAUTH_STATE_COOKIE
    ];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, {
      path: "/",
      secure: true,
      sameSite: "none",
    });

    try {
      const tokenResponse = await exchangeCodeForGoogleToken(code);
      const googleUser = await getGoogleUserInfo(tokenResponse.access_token);

      if (!googleUser.sub) {
        res.status(400).json({ error: "Google user id (sub) missing" });
        return;
      }

      // We use Google's stable `sub` claim as our internal `openId`, prefixed
      // so it can never collide with an id minted by another login method.
      const openId = `google:${googleUser.sub}`;

      await db.upsertUser({
        openId,
        name: googleUser.name || null,
        email: googleUser.email ?? null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId(openId);

      if (!user) {
        res.status(500).json({ error: "Authenticated user could not be loaded" });
        return;
      }

      let redirectTo = "/";
      if (invitationToken) {
        try {
          await db.consumeInvitation(invitationToken, user.id);
          redirectTo = "/espace-client";
        } catch (err) {
          console.error("[OAuth] Invitation consumption failed", err);
          redirectTo = "/espace-client/invite/erreur";
        }
      }

      const sessionToken = await sdk.createSessionToken(user.id, {
        name: googleUser.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.redirect(302, redirectTo);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
