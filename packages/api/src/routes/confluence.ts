import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import type { Env } from "../types";
import * as kv from "../google/kv";

export const confluenceRoutes = new Hono<{ Bindings: Env }>();

interface ConfluenceSearchResult {
  id: string;
  title: string;
  _links?: {
    webui?: string;
    base?: string;
  };
}

interface ConfluenceSearchResponse {
  results?: ConfluenceSearchResult[];
  _links?: {
    base?: string;
  };
}

function escapeCqlQuery(query: string): string {
  return query.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

confluenceRoutes.get("/search", async (c) => {
  const sessionId = getCookie(c, "session");
  const session = sessionId ? await kv.getSession(c.env.FLOWDOCS_KV, sessionId) : null;
  if (!session?.userId) {
    return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);
  }

  const q = c.req.query("q")?.trim() ?? "";
  if (!q) return c.json({ error: "Query is required", code: "BAD_REQUEST" }, 400);

  if (!session.confluenceToken || !session.confluenceCloudId) {
    return c.json({ error: "Confluence not configured", code: "CONFLUENCE_NOT_CONFIGURED" }, 400);
  }

  const params = new URLSearchParams({
    cql: `title ~ "${escapeCqlQuery(q)}" AND type = page`,
    expand: "_links.webui",
  });

  const res = await fetch(
    `https://api.atlassian.com/ex/confluence/${session.confluenceCloudId}/wiki/rest/api/content/search?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${session.confluenceToken}`,
        Accept: "application/json",
      },
    }
  );

  if (res.status === 401) {
    return c.json({ error: "Confluence token expired", code: "CONFLUENCE_TOKEN_EXPIRED" }, 401);
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    console.error("Confluence search failed", errorText);
    return c.json({ error: "Confluence API error", code: "CONFLUENCE_API_ERROR" }, 502);
  }

  const data = await res.json() as ConfluenceSearchResponse;
  const baseUrl = data._links?.base ?? session.confluenceDomain ?? "";
  const results = (data.results ?? []).map((result) => ({
    id: result.id,
    title: result.title,
    url: result._links?.webui
      ? `${result._links.base ?? baseUrl}${result._links.webui}`
      : baseUrl,
  }));

  return c.json(results);
});
