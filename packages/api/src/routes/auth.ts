import { Hono } from "hono";
import type { Env } from "../types";
import { getSession, saveSession } from "../middleware/session";
import { getAuthStatus } from "../google/auth";
import type { AuthStatus } from "@flowdocs/shared";

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.get("/status", async (c) => {
  const base: AuthStatus = {
    google:     { provider: "google",     connected: false },
    notion:     { provider: "notion",     connected: false },
    confluence: { provider: "confluence", connected: false },
    confluenceConnected: false,
  };
  const result = await getSession(c);
  if (!result) return c.json(base);
  return c.json(await getAuthStatus(result.sessionId, c.env));
});

authRoutes.get("/notion/url", async (c) => {
  const result = await getSession(c);
  if (!result?.session.userId) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

  const state = crypto.randomUUID();
  await c.env.FLOWDOCS_KV.put(`oauth_state:${state}`, "1", { expirationTtl: 300 });

  const redirectUri = c.env.ENVIRONMENT === "development"
    ? "http://localhost:8787/api/auth/notion/callback"
    : "https://flowdocs-api.jon-ldg85.workers.dev/api/auth/notion/callback";

  const params = new URLSearchParams({
    client_id:     c.env.NOTION_CLIENT_ID,
    redirect_uri:  redirectUri,
    response_type: "code",
    owner:         "user",
    state,
  });
  return c.json({ url: `https://api.notion.com/v1/oauth/authorize?${params}` });
});

authRoutes.get("/notion/callback", async (c) => {
  const error = c.req.query("error");
  if (error) return c.html("<p>Notion authorization denied. You can close this window.</p>");

  const code  = c.req.query("code");
  const state = c.req.query("state");
  if (!code || !state) return c.html("<p>Invalid callback. You can close this window.</p>", 400);

  const stateValid = await c.env.FLOWDOCS_KV.get(`oauth_state:${state}`);
  if (!stateValid) return c.html("<p>Invalid or expired state. You can close this window.</p>", 400);
  await c.env.FLOWDOCS_KV.delete(`oauth_state:${state}`);

  const redirectUri = c.env.ENVIRONMENT === "development"
    ? "http://localhost:8787/api/auth/notion/callback"
    : "https://flowdocs-api.jon-ldg85.workers.dev/api/auth/notion/callback";

  const tokenRes = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${c.env.NOTION_CLIENT_ID}:${c.env.NOTION_CLIENT_SECRET}`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
  });

  if (!tokenRes.ok) {
    console.error("Notion token exchange failed", await tokenRes.text());
    return c.html("<p>Notion auth error. You can close this window.</p>", 502);
  }

  const { access_token } = await tokenRes.json() as { access_token: string };

  const result = await getSession(c);
  if (result) {
    await saveSession(c, result.sessionId, { ...result.session, notionToken: access_token });
  }

  return c.html(
    "<html><body><p>Notion connected. You can close this window.</p><script>window.close()</script></body></html>"
  );
});

authRoutes.delete("/:provider", async (c) => {
  const result = await getSession(c);
  if (!result) return c.json({ success: true });
  const provider = c.req.param("provider");
  const session = { ...result.session };
  if (provider === "google")     { delete session.googleAccessToken; delete session.googleRefreshToken; delete session.googleEmail; }
  if (provider === "notion")     { delete session.notionToken; }
  if (provider === "confluence") {
    delete session.confluenceToken;
    delete session.confluenceRefreshToken;
    delete session.confluenceTokenExpiry;
    delete session.confluenceCloudId;
    delete session.confluenceDomain;
    delete session.confluenceEmail;
  }
  await saveSession(c, result.sessionId, session);
  return c.json({ success: true });
});
