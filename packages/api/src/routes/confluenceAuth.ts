import { Hono } from "hono";
import type { Env } from "../types";
import { getSession, saveSession } from "../middleware/session";
import { deleteOAuthState, getOAuthState, setOAuthState } from "../google/kv";

export const confluenceAuthRoutes = new Hono<{ Bindings: Env }>();

interface AtlassianTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

interface AccessibleResource {
  id: string;
  url: string;
  name?: string;
}

function redirectUri(env: Env): string {
  return env.ENVIRONMENT === "production"
    ? "https://flowdocs-api.workers.dev/api/auth/confluence/callback"
    : "http://localhost:8787/api/auth/confluence/callback";
}

function frontendOrigin(env: Env): string {
  return env.ENVIRONMENT === "production"
    ? "https://flowdocs.pages.dev"
    : "http://localhost:5173";
}

function hasConfluenceOAuthConfig(env: Env): boolean {
  return Boolean(env.CONFLUENCE_CLIENT_ID?.trim() && env.CONFLUENCE_CLIENT_SECRET?.trim());
}

confluenceAuthRoutes.get("/url", async (c) => {
  const result = await getSession(c);
  if (!result?.session.userId) {
    return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
  }
  if (!hasConfluenceOAuthConfig(c.env)) {
    return c.json({ error: "Confluence OAuth is not configured", code: "CONFLUENCE_NOT_CONFIGURED" }, 400);
  }

  const state = crypto.randomUUID();
  await setOAuthState(c.env.FLOWDOCS_KV, state);

  const params = new URLSearchParams({
    audience: "api.atlassian.com",
    client_id: c.env.CONFLUENCE_CLIENT_ID,
    scope: "read:confluence-content.all offline_access",
    redirect_uri: redirectUri(c.env),
    state,
    response_type: "code",
    prompt: "consent",
  });

  return c.json({ url: `https://auth.atlassian.com/authorize?${params.toString()}` });
});

confluenceAuthRoutes.get("/callback", async (c) => {
  const error = c.req.query("error");
  if (error) {
    return c.json({ error: "OAuth authorization denied", code: "OAUTH_DENIED" }, 400);
  }

  const code = c.req.query("code");
  const state = c.req.query("state");
  if (!code || !state) {
    return c.json({ error: "Invalid state parameter", code: "INVALID_STATE" }, 400);
  }

  const result = await getSession(c);
  if (!result?.session.userId) {
    return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
  }
  if (!hasConfluenceOAuthConfig(c.env)) {
    return c.json({ error: "Confluence OAuth is not configured", code: "CONFLUENCE_NOT_CONFIGURED" }, 400);
  }

  const stateValid = await getOAuthState(c.env.FLOWDOCS_KV, state);
  if (!stateValid) {
    return c.json({ error: "Invalid state parameter", code: "INVALID_STATE" }, 400);
  }
  await deleteOAuthState(c.env.FLOWDOCS_KV, state);

  const tokenRes = await fetch("https://auth.atlassian.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: c.env.CONFLUENCE_CLIENT_ID,
      client_secret: c.env.CONFLUENCE_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri(c.env),
    }),
  });

  if (!tokenRes.ok) {
    console.error("Confluence token exchange failed", await tokenRes.text());
    return c.json({ error: "Confluence auth error", code: "CONFLUENCE_AUTH_ERROR" }, 502);
  }

  const tokens = await tokenRes.json() as AtlassianTokenResponse;
  const resourcesRes = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!resourcesRes.ok) {
    console.error("Confluence accessible-resources failed", await resourcesRes.text());
    return c.json({ error: "Confluence auth error", code: "CONFLUENCE_AUTH_ERROR" }, 502);
  }

  const resources = await resourcesRes.json() as AccessibleResource[];
  const resource = resources[0];
  if (!resource?.id || !resource.url) {
    return c.json({ error: "No Confluence site found", code: "NO_CONFLUENCE_SITE" }, 400);
  }

  await saveSession(c, result.sessionId, {
    ...result.session,
    confluenceToken: tokens.access_token,
    confluenceRefreshToken: tokens.refresh_token,
    confluenceTokenExpiry: Date.now() + ((tokens.expires_in ?? 3600) * 1000),
    confluenceCloudId: resource.id,
    confluenceDomain: resource.url,
  });

  return c.redirect(frontendOrigin(c.env));
});

confluenceAuthRoutes.delete("/", async (c) => {
  const result = await getSession(c);
  if (!result) return c.json({ ok: true });

  const session = { ...result.session };
  delete session.confluenceToken;
  delete session.confluenceRefreshToken;
  delete session.confluenceTokenExpiry;
  delete session.confluenceCloudId;
  delete session.confluenceDomain;
  delete session.confluenceEmail;

  await saveSession(c, result.sessionId, session);
  return c.json({ ok: true });
});
