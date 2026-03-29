import type { Env } from "../types";
import * as googleApi from "./api";
import * as kv from "./kv";

const REFRESH_BUFFER_MS = 60 * 1000; // refresh 60s before expiry

export class TokenError extends Error {
  readonly code = "SESSION_EXPIRED";
  constructor() { super("Session expired"); }
}

export async function ensureFreshToken(
  sessionId: string,
  session: kv.Session,
  env: Env
): Promise<string> {
  const { googleAccessToken, googleRefreshToken, googleExpiresAt } = session;

  if (!googleAccessToken || !googleRefreshToken) throw new TokenError();

  const needsRefresh = !googleExpiresAt || Date.now() >= googleExpiresAt - REFRESH_BUFFER_MS;
  if (!needsRefresh) return googleAccessToken;

  try {
    const fresh = await googleApi.refreshAccessToken(
      googleRefreshToken,
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET
    );
    await kv.setSession(env.FLOWDOCS_KV, sessionId, {
      ...session,
      googleAccessToken: fresh.accessToken,
      googleExpiresAt:   fresh.expiresAt,
    });
    return fresh.accessToken;
  } catch {
    await kv.deleteSession(env.FLOWDOCS_KV, sessionId);
    throw new TokenError();
  }
}
