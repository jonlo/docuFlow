import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import type { Env } from "../types";
import * as kv from "../google/kv";

export const notionRoutes = new Hono<{ Bindings: Env }>();

// ── Notion search types ───────────────────────────────────────────────────────

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

// ── Block conversion types ────────────────────────────────────────────────────

interface NotionAnnotations {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  underline: boolean;
  code: boolean;
  color: string;
}

interface NotionRichText {
  type: string;
  text?: { content: string; link?: { url: string } | null };
  annotations: NotionAnnotations;
  plain_text: string;
}

interface NotionBlock {
  id: string;
  type: string;
  paragraph?: { rich_text: NotionRichText[] };
  heading_1?: { rich_text: NotionRichText[] };
  heading_2?: { rich_text: NotionRichText[] };
  heading_3?: { rich_text: NotionRichText[] };
  bulleted_list_item?: { rich_text: NotionRichText[] };
  numbered_list_item?: { rich_text: NotionRichText[] };
  to_do?: { rich_text: NotionRichText[]; checked: boolean };
  quote?: { rich_text: NotionRichText[] };
  code?: { rich_text: NotionRichText[]; language: string };
  divider?: Record<string, never>;
}

export interface BlockNoteInlineContent {
  type: "text";
  text: string;
  styles: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
  };
}

export interface BlockNoteBlock {
  id: string;
  type: string;
  props: Record<string, unknown>;
  content: BlockNoteInlineContent[];
  children: BlockNoteBlock[];
}

// ── Block conversion utilities ────────────────────────────────────────────────

const SUPPORTED_NOTION_TYPES = new Set([
  "paragraph", "heading_1", "heading_2", "heading_3",
  "bulleted_list_item", "numbered_list_item", "to_do",
  "quote", "code", "divider",
]);

function richTextToInlineContent(richText: NotionRichText[]): BlockNoteInlineContent[] {
  return richText.map((rt) => {
    const styles: BlockNoteInlineContent["styles"] = {};
    if (rt.annotations.bold)          styles.bold          = true;
    if (rt.annotations.italic)        styles.italic        = true;
    if (rt.annotations.strikethrough) styles.strikethrough = true;
    if (rt.annotations.underline)     styles.underline     = true;
    if (rt.annotations.code)          styles.code          = true;
    return { type: "text", text: rt.plain_text, styles };
  });
}

const BASE_TEXT_PROPS = {
  textAlignment: "left",
  textColor: "default",
  backgroundColor: "default",
} as const;

export function notionBlocksToBlockNote(
  blocks: NotionBlock[]
): { blocks: BlockNoteBlock[]; hasUnsupportedBlocks: boolean } {
  let hasUnsupportedBlocks = false;

  const result: BlockNoteBlock[] = blocks.map((block) => {
    if (!SUPPORTED_NOTION_TYPES.has(block.type)) hasUnsupportedBlocks = true;

    switch (block.type) {
      case "paragraph":
        return { id: block.id, type: "paragraph", props: { ...BASE_TEXT_PROPS }, content: richTextToInlineContent(block.paragraph?.rich_text ?? []), children: [] };
      case "heading_1":
        return { id: block.id, type: "heading", props: { level: 1, ...BASE_TEXT_PROPS }, content: richTextToInlineContent(block.heading_1?.rich_text ?? []), children: [] };
      case "heading_2":
        return { id: block.id, type: "heading", props: { level: 2, ...BASE_TEXT_PROPS }, content: richTextToInlineContent(block.heading_2?.rich_text ?? []), children: [] };
      case "heading_3":
        return { id: block.id, type: "heading", props: { level: 3, ...BASE_TEXT_PROPS }, content: richTextToInlineContent(block.heading_3?.rich_text ?? []), children: [] };
      case "bulleted_list_item":
        return { id: block.id, type: "bulletListItem", props: { ...BASE_TEXT_PROPS }, content: richTextToInlineContent(block.bulleted_list_item?.rich_text ?? []), children: [] };
      case "numbered_list_item":
        return { id: block.id, type: "numberedListItem", props: { ...BASE_TEXT_PROPS }, content: richTextToInlineContent(block.numbered_list_item?.rich_text ?? []), children: [] };
      case "to_do":
        return { id: block.id, type: "checkListItem", props: { checked: block.to_do?.checked ?? false, ...BASE_TEXT_PROPS }, content: richTextToInlineContent(block.to_do?.rich_text ?? []), children: [] };
      case "quote":
        return { id: block.id, type: "paragraph", props: { ...BASE_TEXT_PROPS }, content: richTextToInlineContent(block.quote?.rich_text ?? []), children: [] };
      case "code":
        return { id: block.id, type: "codeBlock", props: { language: block.code?.language ?? "text" }, content: richTextToInlineContent(block.code?.rich_text ?? []), children: [] };
      case "divider":
        return { id: block.id, type: "paragraph", props: { ...BASE_TEXT_PROPS }, content: [], children: [] };
      default:
        // Unsupported: render as empty paragraph
        return { id: block.id, type: "paragraph", props: { ...BASE_TEXT_PROPS }, content: [], children: [] };
    }
  });

  return { blocks: result, hasUnsupportedBlocks };
}

function inlineContentToRichText(content: BlockNoteInlineContent[]): NotionRichText[] {
  return (content ?? []).map((item) => ({
    type: "text",
    text: { content: item.text, link: null },
    annotations: {
      bold:          item.styles.bold          ?? false,
      italic:        item.styles.italic        ?? false,
      strikethrough: item.styles.strikethrough ?? false,
      underline:     item.styles.underline     ?? false,
      code:          item.styles.code          ?? false,
      color:         "default",
    },
    plain_text: item.text,
  }));
}

export function blockNoteToNotionBlocks(blocks: BlockNoteBlock[]): object[] {
  return blocks.map((block) => {
    const richText = inlineContentToRichText(block.content ?? []);
    switch (block.type) {
      case "paragraph":
        return { object: "block", type: "paragraph", paragraph: { rich_text: richText } };
      case "heading": {
        const lvl = (block.props.level as number) ?? 1;
        const key = `heading_${lvl}`;
        return { object: "block", type: key, [key]: { rich_text: richText } };
      }
      case "bulletListItem":
        return { object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: richText } };
      case "numberedListItem":
        return { object: "block", type: "numbered_list_item", numbered_list_item: { rich_text: richText } };
      case "checkListItem":
        return { object: "block", type: "to_do", to_do: { rich_text: richText, checked: block.props.checked ?? false } };
      case "codeBlock":
        return { object: "block", type: "code", code: { rich_text: richText, language: block.props.language ?? "plain text" } };
      default:
        return { object: "block", type: "paragraph", paragraph: { rich_text: richText } };
    }
  });
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

// ── GET /api/notion/documents/:providerDocId ──────────────────────────────────

notionRoutes.get("/documents/:providerDocId", async (c) => {
  const sessionId = getCookie(c, "session");
  const session   = sessionId ? await kv.getSession(c.env.FLOWDOCS_KV, sessionId) : null;
  if (!session?.userId) return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);

  const notionToken = session.notionToken;
  if (!notionToken) return c.json({ error: "Notion not configured", code: "NOTION_NOT_CONFIGURED" }, 400);

  const providerDocId = c.req.param("providerDocId");

  const res = await fetch(
    `https://api.notion.com/v1/blocks/${providerDocId}/children?page_size=100`,
    {
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
      },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    return c.json({ error: err.message ?? "Notion API error", code: "NOTION_API_ERROR" }, 502);
  }

  const data = await res.json() as { results: NotionBlock[] };
  return c.json(notionBlocksToBlockNote(data.results ?? []));
});

// ── PUT /api/notion/documents/:providerDocId ──────────────────────────────────

notionRoutes.put("/documents/:providerDocId", async (c) => {
  const sessionId = getCookie(c, "session");
  const session   = sessionId ? await kv.getSession(c.env.FLOWDOCS_KV, sessionId) : null;
  if (!session?.userId) return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);

  const notionToken = session.notionToken;
  if (!notionToken) return c.json({ error: "Notion not configured", code: "NOTION_NOT_CONFIGURED" }, 400);

  const providerDocId = c.req.param("providerDocId");
  const body = await c.req.json<{ blocks: BlockNoteBlock[] }>();

  // 1. Fetch existing children
  const fetchRes = await fetch(
    `https://api.notion.com/v1/blocks/${providerDocId}/children?page_size=100`,
    {
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
      },
    }
  );

  if (!fetchRes.ok) {
    return c.json({ error: "Notion API error", code: "NOTION_API_ERROR" }, 502);
  }

  const existing = await fetchRes.json() as { results: Array<{ id: string }> };

  // 2. Archive each existing child
  for (const child of existing.results ?? []) {
    const delRes = await fetch(`https://api.notion.com/v1/blocks/${child.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
      },
    });
    if (!delRes.ok) {
      return c.json({ error: "Notion API error", code: "NOTION_API_ERROR" }, 502);
    }
  }

  // 3. Append new blocks (skip if empty)
  if ((body.blocks ?? []).length > 0) {
    const appendRes = await fetch(
      `https://api.notion.com/v1/blocks/${providerDocId}/children`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({ children: blockNoteToNotionBlocks(body.blocks) }),
      }
    );
    if (!appendRes.ok) {
      return c.json({ error: "Notion API error", code: "NOTION_API_ERROR" }, 502);
    }
  }

  return c.json({ ok: true });
});
