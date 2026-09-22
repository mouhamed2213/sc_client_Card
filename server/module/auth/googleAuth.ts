import { AXIOS_TIMEOUT_MS } from "@shared/const";
import { ENV } from "../../_core/env";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";

export type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
};

export type GoogleUserInfo = {
  sub: string; // stable Google user id used only for legacy OAuth identity
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

function assertConfigured() {
  if (!ENV.googleClientId || !ENV.googleClientSecret) {
    throw new Error(
      "[GoogleAuth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not configured."
    );
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = AXIOS_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Exchange the authorization `code` Google sent to our redirect URI for an
 * access token (and, since we request the `openid` scope, an ID token).
 */
export async function exchangeCodeForGoogleToken(
  code: string
): Promise<GoogleTokenResponse> {
  assertConfigured();

  const body = new URLSearchParams({
    code,
    client_id: ENV.googleClientId,
    client_secret: ENV.googleClientSecret,
    redirect_uri: ENV.googleRedirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetchWithTimeout(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `[GoogleAuth] Token exchange failed (${res.status}): ${text}`
    );
  }

  return (await res.json()) as GoogleTokenResponse;
}

/** Fetch the Google profile (id, name, email, avatar) for an access token. */
export async function getGoogleUserInfo(
  accessToken: string
): Promise<GoogleUserInfo> {
  const res = await fetchWithTimeout(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `[GoogleAuth] Fetching user info failed (${res.status}): ${text}`
    );
  }

  return (await res.json()) as GoogleUserInfo;
}

/** Builds the URL that starts Google's consent screen, given our CSRF `state`. */
export function buildGoogleAuthUrl(state: string): string {
  assertConfigured();

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", ENV.googleClientId);
  url.searchParams.set("redirect_uri", ENV.googleRedirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  // Show the account chooser every time rather than silently reusing the
  // last Google session in the browser.
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}
