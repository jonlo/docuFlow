import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import type { Env } from "../types";
import { buildGoogleAuthUrl, exchangeGoogleCode, getGoogleUserInfo } from "../services/google";
import { getSession, saveSession } from "../middleware/session";
import type { AuthStatus } from "@flowdocs/shared";

export const authRoutes = new Hono<{ Bindings: Env }>();

const TTL = 60 * 60 * 24 * 7;

function redirectUri(env: Env): string {
  return env.ENVIRONMENT === "production"
    ? "https://flowdocs-api.workers.dev/api/auth/google/callback"
    : "http://localhost:8787/api/auth/google/callback";
}

authRoutes.get("/status", async (c) => {
  const base: AuthStatus = {
    google:     { provider: "google",     connected: false },
    notion:     { provider: "notion",     connected: false },
    confluence: { provider: "confluence", connected: false },
  };
  const result = await getSession(c);
  if (!result) return c.json(base);
  const { session } = result;
  if (session.googleAccessToken) base.google = { provider: "google", connected: true, accountEmail: session.googleEmail };
  if (session.notionToken)       base.notion = { provider: "notion", connected: true };
  if (session.confluenceToken)   base.confluence = { provider: "confluence", connected: true };
  return c.json(base);
});

authRoutes.get("/google/url", (c) => {
  const url = buildGoogleAuthUrl(c.env.GOOGLE_CLIENT_ID, redirectUri(c.env));
  return c.json({ url });
});

authRoutes.get("/google/callback", async (c) => {
  const code  = c.req.query("code");
  const error = c.req.query("error");
  if (error || !code) return c.html("<script>window.close()</script>", 400);

  try {
    const tokens   = await exchangeGoogleCode(code, c.env.GOOGLE_CLIENT_ID, c.env.GOOGLE_CLIENT_SECRET, redirectUri(c.env));
    const userInfo = await getGoogleUserInfo(tokens.accessToken);
    const sessionId = crypto.randomUUID();
    await saveSession(c, sessionId, {
      googleAccessToken:  tokens.accessToken,
      googleRefreshToken: tokens.refreshToken,
      googleExpiresAt:    tokens.expiresAt,
      googleEmail:        userInfo.email,
    });
    setCookie(c, "session", sessionId, { httpOnly: true, secure: c.env.ENVIRONMENT === "production", sameSite: "Lax", maxAge: TTL, path: "/" });
    return c.html("<html><body><p>Connected. You can close this window.</p><script>window.close()</script></body></html>");
  } catch (err) {
    console.error(err);
    return c.html("<p>Auth error</p>", 500);
  }
});

authRoutes.post("/notion", async (c) => {
  const result = await getSession(c);
  if (!result) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
  const body = await c.req.json<{ token: string }>();
  if (!body.token) return c.json({ error: "Token required", code: "BAD_REQUEST" }, 400);
  await saveSession(c, result.sessionId, { ...result.session, notionToken: body.token });
  return c.json({ success: true });
});

authRoutes.delete("/:provider", async (c) => {
  const result = await getSession(c);
  if (!result) return c.json({ success: true });
  const provider = c.req.param("provider");
  const session = { ...result.session };
  if (provider === "google")     { delete session.googleAccessToken; delete session.googleRefreshToken; delete session.googleEmail; }
  if (provider === "notion")     { delete session.notionToken; }
  if (provider === "confluence") { delete session.confluenceToken; delete session.confluenceDomain; delete session.confluenceEmail; }
  await saveSession(c, result.sessionId, session);
  return c.json({ success: true });
});
