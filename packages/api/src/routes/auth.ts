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
  };
  const result = await getSession(c);
  if (!result) return c.json(base);
  return c.json(await getAuthStatus(result.sessionId, c.env));
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
