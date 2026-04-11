import type { AuthStatus } from "@flowdocs/shared";
import type { Env } from "../types";
import * as googleApi from "./api";
import * as kv from "./kv";

export function buildConsentUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/contacts.readonly",
    ].join(" "),
    access_type: "offline",
    prompt:      "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function handleCallback(
  code: string,
  state: string,
  env: Env,
  redirectUri: string
): Promise<{ sessionId: string }> {
  // Validate and consume CSRF state (throws if invalid/expired)
  const stateValid = await kv.getOAuthState(env.FLOWDOCS_KV, state);
  if (!stateValid) throw new Error("INVALID_STATE");
  await kv.deleteOAuthState(env.FLOWDOCS_KV, state);

  // Exchange code for tokens and get user info
  const tokens   = await googleApi.exchangeCode(code, env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, redirectUri);
  const userInfo = await googleApi.getUserInfo(tokens.accessToken);

  // Upsert user in D1 — ON CONFLICT keeps existing id stable
  const newUserId = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO users (id, google_id, email, name, avatar_url)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(google_id) DO UPDATE SET
      email      = excluded.email,
      name       = excluded.name,
      avatar_url = excluded.avatar_url
  `).bind(newUserId, userInfo.sub, userInfo.email, userInfo.name, userInfo.picture ?? null).run();

  // Re-read to get the stable id (may differ from newUserId if user already existed)
  const row = await env.DB
    .prepare("SELECT id FROM users WHERE google_id = ?")
    .bind(userInfo.sub)
    .first<{ id: string }>();
  const userId = row!.id;

  // Create session in KV
  const sessionId = crypto.randomUUID();
  await kv.setSession(env.FLOWDOCS_KV, sessionId, {
    googleAccessToken:  tokens.accessToken,
    googleRefreshToken: tokens.refreshToken,
    googleExpiresAt:    tokens.expiresAt,
    googleEmail:        userInfo.email,
    userId,
  });

  return { sessionId };
}

export async function getAuthStatus(sessionId: string, env: Env): Promise<AuthStatus> {
  const base: AuthStatus = {
    google:     { provider: "google",     connected: false },
    notion:     { provider: "notion",     connected: false },
    confluence: { provider: "confluence", connected: false },
    confluenceConnected: false,
  };
  const session = await kv.getSession(env.FLOWDOCS_KV, sessionId);
  if (!session) return base;
  if (session.googleAccessToken) base.google = { provider: "google", connected: true, accountEmail: session.googleEmail };
  if (session.notionToken)       base.notion = { provider: "notion", connected: true };
  if (session.confluenceToken) {
    base.confluence = { provider: "confluence", connected: true, accountEmail: session.confluenceEmail };
    base.confluenceConnected = true;
  }
  return base;
}
