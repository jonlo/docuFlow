import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import type { Env } from "../types";
import * as googleAuth from "./auth";
import * as googleCalendar from "./calendar";
import * as kv from "./kv";
import { ensureFreshToken, TokenError } from "./tokens";

export const googleRoutes = new Hono<{ Bindings: Env }>();

const SESSION_TTL_S = 60 * 60 * 24 * 7;

function redirectUri(env: Env): string {
  return env.ENVIRONMENT === "production"
    ? "https://flowdocs-api.workers.dev/api/auth/google/callback"
    : "http://localhost:8787/api/auth/google/callback";
}

// ── Auth ──────────────────────────────────────────────────────────────────────

// GET /api/auth/google/url
googleRoutes.get("/auth/google/url", async (c) => {
  const state = crypto.randomUUID();
  await kv.setOAuthState(c.env.FLOWDOCS_KV, state);
  const url = googleAuth.buildConsentUrl(c.env.GOOGLE_CLIENT_ID, redirectUri(c.env), state);
  return c.json({ url });
});

// GET /api/auth/google/callback
googleRoutes.get("/auth/google/callback", async (c) => {
  const error = c.req.query("error");
  if (error) {
    return c.json({ error: "OAuth authorization denied", code: "OAUTH_DENIED" }, 400);
  }

  const code  = c.req.query("code");
  const state = c.req.query("state");
  if (!code || !state) {
    return c.json({ error: "Invalid state parameter", code: "INVALID_STATE" }, 400);
  }

  try {
    const { sessionId } = await googleAuth.handleCallback(code, state, c.env, redirectUri(c.env));
    setCookie(c, "session", sessionId, {
      httpOnly: true,
      secure:   c.env.ENVIRONMENT === "production",
      sameSite: "Lax",
      maxAge:   SESSION_TTL_S,
      path:     "/",
    });
    return c.html(
      "<html><body><p>Connected. You can close this window.</p><script>window.close()</script></body></html>"
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "INVALID_STATE") {
      return c.json({ error: "Invalid state parameter", code: "INVALID_STATE" }, 400);
    }
    console.error(err);
    return c.html("<p>Auth error</p>", 500);
  }
});

// ── Events ────────────────────────────────────────────────────────────────────

// GET /api/events
googleRoutes.get("/events", async (c) => {
  const sessionId = getCookie(c, "session");
  if (!sessionId) {
    return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);
  }

  const session = await kv.getSession(c.env.FLOWDOCS_KV, sessionId);
  if (!session?.googleAccessToken || !session.userId) {
    return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);
  }

  try {
    const accessToken = await ensureFreshToken(sessionId, session, c.env);
    const events = await googleCalendar.syncAndReturnEvents(session.userId, accessToken, c.env);
    return c.json(events);
  } catch (err) {
    if (err instanceof TokenError) {
      return c.json({ error: "Session expired", code: "SESSION_EXPIRED" }, 401);
    }
    throw err;
  }
});
