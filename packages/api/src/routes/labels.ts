import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import type { Env } from "../types";
import type { Label, CreateLabelBody } from "@flowdocs/shared";
import * as kv from "../google/kv";

export const labelRoutes = new Hono<{ Bindings: Env }>();

// GET /api/labels
labelRoutes.get("/", async (c) => {
  const sessionId = getCookie(c, "session");
  const session   = sessionId ? await kv.getSession(c.env.FLOWDOCS_KV, sessionId) : null;
  if (!session?.userId) return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);

  const result = await c.env.DB.prepare(
    "SELECT id, name, color FROM labels ORDER BY name ASC"
  ).all<Label>();

  return c.json(result.results ?? []);
});

// POST /api/labels
labelRoutes.post("/", async (c) => {
  const sessionId = getCookie(c, "session");
  const session   = sessionId ? await kv.getSession(c.env.FLOWDOCS_KV, sessionId) : null;
  if (!session?.userId) return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);

  const body = await c.req.json<Partial<CreateLabelBody>>();
  if (!body.name?.trim() || !body.color?.trim()) {
    return c.json({ error: "Name and color are required", code: "BAD_REQUEST" }, 400);
  }

  const id = crypto.randomUUID();
  try {
    await c.env.DB.prepare(
      "INSERT INTO labels (id, name, color) VALUES (?, ?, ?)"
    ).bind(id, body.name.trim(), body.color.trim()).run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.toLowerCase().includes("unique")) {
      return c.json({ error: "Label already exists", code: "LABEL_EXISTS" }, 409);
    }
    throw err;
  }

  const row = await c.env.DB.prepare("SELECT id, name, color FROM labels WHERE id = ?")
    .bind(id).first<Label>();
  return c.json(row!, 201);
});

// PATCH /api/labels/:id
labelRoutes.patch("/:id", async (c) => {
  const sessionId = getCookie(c, "session");
  const session   = sessionId ? await kv.getSession(c.env.FLOWDOCS_KV, sessionId) : null;
  if (!session?.userId) return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);

  const id = c.req.param("id");
  const existing = await c.env.DB.prepare("SELECT id FROM labels WHERE id = ?")
    .bind(id).first<{ id: string }>();
  if (!existing) return c.json({ error: "Label not found", code: "NOT_FOUND" }, 404);

  const body = await c.req.json<Partial<{ name: string; color: string }>>();
  if (!body.name?.trim() && !body.color?.trim()) {
    return c.json({ error: "name or color is required", code: "BAD_REQUEST" }, 400);
  }

  if (body.name?.trim()) {
    await c.env.DB.prepare("UPDATE labels SET name = ? WHERE id = ?")
      .bind(body.name.trim(), id).run();
  }
  if (body.color?.trim()) {
    await c.env.DB.prepare("UPDATE labels SET color = ? WHERE id = ?")
      .bind(body.color.trim(), id).run();
  }

  const row = await c.env.DB.prepare("SELECT id, name, color FROM labels WHERE id = ?")
    .bind(id).first<Label>();
  return c.json(row!);
});

// DELETE /api/labels/:id
labelRoutes.delete("/:id", async (c) => {
  const sessionId = getCookie(c, "session");
  const session   = sessionId ? await kv.getSession(c.env.FLOWDOCS_KV, sessionId) : null;
  if (!session?.userId) return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);

  const id = c.req.param("id");
  const existing = await c.env.DB.prepare("SELECT id FROM labels WHERE id = ?")
    .bind(id).first<{ id: string }>();
  if (!existing) return c.json({ error: "Label not found", code: "NOT_FOUND" }, 404);

  await c.env.DB.prepare("DELETE FROM labels WHERE id = ?").bind(id).run();
  return new Response(null, { status: 204 });
});
