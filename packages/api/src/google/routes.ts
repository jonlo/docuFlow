import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import type { Env } from "../types";
import type { CreateEventBody, UpdateEventBody } from "@flowdocs/shared";
import * as googleApi from "./api";
import * as googleAuth from "./auth";
import * as googleCalendar from "./calendar";
import * as kv from "./kv";
import { ensureFreshToken, TokenError } from "./tokens";

export const googleRoutes = new Hono<{ Bindings: Env }>();

const SESSION_TTL_S = 60 * 60 * 24 * 7;

function redirectUri(env: Env): string {
  return env.ENVIRONMENT === "development"
    ? "http://localhost:8787/api/auth/google/callback"
    : "https://flowdocs-api.jon-ldg85.workers.dev/api/auth/google/callback";
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
      secure:   true,
      sameSite: "None",
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

// POST /api/events
googleRoutes.post("/events", async (c) => {
  const sessionId = getCookie(c, "session");
  const session   = sessionId ? await kv.getSession(c.env.FLOWDOCS_KV, sessionId) : null;
  if (!session?.googleAccessToken || !session.userId || !sessionId) {
    return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);
  }
  try {
    const body = await c.req.json<CreateEventBody>();
    const accessToken = await ensureFreshToken(sessionId, session, c.env);
    const event = await googleCalendar.createEvent(session.userId, accessToken, body, c.env);
    return c.json(event, 201);
  } catch (err) {
    if (err instanceof TokenError) return c.json({ error: "Session expired", code: "SESSION_EXPIRED" }, 401);
    console.error(err);
    return c.json({ error: "Google API error", code: "GOOGLE_API_ERROR" }, 502);
  }
});

// PATCH /api/events/:id
googleRoutes.patch("/events/:id", async (c) => {
  const sessionId = getCookie(c, "session");
  const session   = sessionId ? await kv.getSession(c.env.FLOWDOCS_KV, sessionId) : null;
  if (!session?.googleAccessToken || !session.userId || !sessionId) {
    return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);
  }
  try {
    const id   = c.req.param("id");
    const body = await c.req.json<UpdateEventBody>();
    const accessToken = await ensureFreshToken(sessionId, session, c.env);
    const event = await googleCalendar.updateEvent(id, session.userId, accessToken, body, c.env);
    return c.json(event);
  } catch (err) {
    if (err instanceof TokenError) return c.json({ error: "Session expired", code: "SESSION_EXPIRED" }, 401);
    if (err instanceof Error && (err as { code?: string }).code === "NOT_FOUND") {
      return c.json({ error: "Event not found", code: "NOT_FOUND" }, 404);
    }
    console.error(err);
    return c.json({ error: "Google API error", code: "GOOGLE_API_ERROR" }, 502);
  }
});

// DELETE /api/events/:id
googleRoutes.delete("/events/:id", async (c) => {
  const sessionId = getCookie(c, "session");
  const session   = sessionId ? await kv.getSession(c.env.FLOWDOCS_KV, sessionId) : null;
  if (!session?.googleAccessToken || !session.userId || !sessionId) {
    return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);
  }
  try {
    const id = c.req.param("id");
    const accessToken = await ensureFreshToken(sessionId, session, c.env);
    await googleCalendar.deleteEvent(id, session.userId, accessToken, c.env);
    return new Response(null, { status: 204 });
  } catch (err) {
    if (err instanceof TokenError) return c.json({ error: "Session expired", code: "SESSION_EXPIRED" }, 401);
    if (err instanceof Error && (err as { code?: string }).code === "NOT_FOUND") {
      return c.json({ error: "Event not found", code: "NOT_FOUND" }, 404);
    }
    console.error(err);
    return c.json({ error: "Google API error", code: "GOOGLE_API_ERROR" }, 502);
  }
});

// PUT /api/events/:id/labels
googleRoutes.put("/events/:id/labels", async (c) => {
  const sessionId = getCookie(c, "session");
  const session   = sessionId ? await kv.getSession(c.env.FLOWDOCS_KV, sessionId) : null;
  if (!session?.googleAccessToken || !session.userId || !sessionId) {
    return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);
  }
  try {
    const id = c.req.param("id");
    const body = await c.req.json<{ labelIds: string[] }>();
    const labelIds = Array.isArray(body.labelIds) ? body.labelIds : [];
    const event = await googleCalendar.setEventLabels(id, labelIds, c.env);
    return c.json(event);
  } catch (err) {
    if (err instanceof Error && (err as { code?: string }).code === "NOT_FOUND") {
      return c.json({ error: "Event not found", code: "NOT_FOUND" }, 404);
    }
    if (err instanceof Error && (err as { code?: string }).code === "INVALID_LABEL_IDS") {
      return c.json({ error: "One or more label IDs are invalid", code: "INVALID_LABEL_IDS" }, 400);
    }
    console.error(err);
    return c.json({ error: "Internal error", code: "INTERNAL_ERROR" }, 500);
  }
});

// GET /api/contacts/search
googleRoutes.get("/contacts/search", async (c) => {
  const sessionId = getCookie(c, "session");
  const session   = sessionId ? await kv.getSession(c.env.FLOWDOCS_KV, sessionId) : null;
  if (!session?.googleAccessToken || !sessionId) {
    return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);
  }
  const q = c.req.query("q") ?? "";
  if (q.length < 2) return c.json([]);
  try {
    const accessToken = await ensureFreshToken(sessionId, session, c.env);
    const results = await googleApi.searchContacts(accessToken, q);
    return c.json(results);
  } catch (err) {
    if (err instanceof TokenError) return c.json({ error: "Session expired", code: "SESSION_EXPIRED" }, 401);
    return c.json([]);
  }
});
