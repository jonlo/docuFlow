import { getCookie } from "hono/cookie";
import type { Context } from "hono";
import type { Env } from "../types";

export interface Session {
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleExpiresAt?: number;
  googleEmail?: string;
  notionToken?: string;
  confluenceDomain?: string;
  confluenceEmail?: string;
  confluenceToken?: string;
  userId?: string;
}

export async function getSession(c: Context<{ Bindings: Env }>): Promise<{ sessionId: string; session: Session } | null> {
  const sessionId = getCookie(c, "session");
  if (!sessionId) return null;
  const raw = await c.env.FLOWDOCS_KV.get(`session:${sessionId}`);
  if (!raw) return null;
  return { sessionId, session: JSON.parse(raw) as Session };
}

export async function saveSession(
  c: Context<{ Bindings: Env }>,
  sessionId: string,
  session: Session
): Promise<void> {
  await c.env.FLOWDOCS_KV.put(
    `session:${sessionId}`,
    JSON.stringify(session),
    { expirationTtl: 60 * 60 * 24 * 7 }
  );
}
