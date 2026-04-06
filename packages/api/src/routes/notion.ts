import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import type { Env } from "../types";
import * as kv from "../google/kv";

export const notionRoutes = new Hono<{ Bindings: Env }>();

interface NotionTextRichText {
  plain_text: string;
}

interface NotionProperty {
  type: string;
  title?: NotionTextRichText[];
}

interface NotionPage {
  id: string;
  url: string;
  properties: Record<string, NotionProperty>;
}

interface NotionSearchResponse {
  results: NotionPage[];
}

function extractTitle(page: NotionPage): string {
  for (const prop of Object.values(page.properties)) {
    if (prop.type === "title" && prop.title?.[0]?.plain_text) {
      return prop.title[0].plain_text;
    }
  }
  return "Untitled";
}

// ── GET /api/notion/search?q= ─────────────────────────────────────────────────

notionRoutes.get("/search", async (c) => {
  const sessionId = getCookie(c, "session");
  const session   = sessionId ? await kv.getSession(c.env.FLOWDOCS_KV, sessionId) : null;
  if (!session?.userId) return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);

  const q = c.req.query("q")?.trim() ?? "";
  if (!q) return c.json({ error: "Query is required", code: "BAD_REQUEST" }, 400);

  const notionToken = session.notionToken;
  if (!notionToken) {
    return c.json({ error: "Notion not configured", code: "NOTION_NOT_CONFIGURED" }, 400);
  }

  const res = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      query: q,
      filter: { value: "page", property: "object" },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    return c.json({ error: err.message ?? "Notion API error", code: "NOTION_API_ERROR" }, 502);
  }

  const data = await res.json() as NotionSearchResponse;
  const results = (data.results ?? []).map((page) => ({
    id: page.id,
    title: extractTitle(page),
    url: page.url,
  }));

  return c.json(results);
});
