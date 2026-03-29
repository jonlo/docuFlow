const SESSION_TTL_S = 60 * 60 * 24 * 7;  // 7 days
const STATE_TTL_S   = 60 * 5;             // 5 minutes

export interface Session {
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleExpiresAt?: number;
  googleEmail?: string;
  userId?: string;            // D1 users.id
  notionToken?: string;
  confluenceDomain?: string;
  confluenceEmail?: string;
  confluenceToken?: string;
}

// ── Session ───────────────────────────────────────────────────────────────────

export async function getSession(kv: KVNamespace, sessionId: string): Promise<Session | null> {
  const raw = await kv.get(`session:${sessionId}`);
  if (!raw) return null;
  return JSON.parse(raw) as Session;
}

export async function setSession(kv: KVNamespace, sessionId: string, session: Session): Promise<void> {
  await kv.put(`session:${sessionId}`, JSON.stringify(session), { expirationTtl: SESSION_TTL_S });
}

export async function deleteSession(kv: KVNamespace, sessionId: string): Promise<void> {
  await kv.delete(`session:${sessionId}`);
}

// ── OAuth state (CSRF) ────────────────────────────────────────────────────────

export async function setOAuthState(kv: KVNamespace, state: string): Promise<void> {
  await kv.put(`oauth_state:${state}`, "1", { expirationTtl: STATE_TTL_S });
}

export async function getOAuthState(kv: KVNamespace, state: string): Promise<boolean> {
  return (await kv.get(`oauth_state:${state}`)) !== null;
}

export async function deleteOAuthState(kv: KVNamespace, state: string): Promise<void> {
  await kv.delete(`oauth_state:${state}`);
}

// ── Sync cache ────────────────────────────────────────────────────────────────

export async function getSyncedAt(kv: KVNamespace, userId: string): Promise<number | null> {
  const val = await kv.get(`synced_at:${userId}`);
  if (!val) return null;
  return parseInt(val, 10);
}

export async function setSyncedAt(kv: KVNamespace, userId: string): Promise<void> {
  await kv.put(`synced_at:${userId}`, String(Date.now()), { expirationTtl: SESSION_TTL_S });
}
