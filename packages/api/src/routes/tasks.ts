import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import type { Env } from "../types";
import type { Task, CreateTaskBody, UpdateTaskBody, Document } from "@flowdocs/shared";
import * as kv from "../google/kv";

export const taskRoutes = new Hono<{ Bindings: Env }>();

// ── Helpers ───────────────────────────────────────────────────────────────────

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  event_id: string | null;
  start: string | null;
  end: string | null;
  created_at: string;
  updated_at: string;
}

interface SessionRow {
  id: string;
  task_id: string;
  started_at: string;
  ended_at: string | null;
}

interface DocumentRow {
  id: string;
  provider: string;
  provider_doc_id: string;
  title: string;
  url: string;
}

interface LabelRow {
  id: string;
  name: string;
  color: string;
}

async function enrichTask(env: Env, row: TaskRow): Promise<Task> {
  const [sessions, docs, labelRows] = await Promise.all([
    env.DB.prepare(
      "SELECT id, task_id, started_at, ended_at FROM task_sessions WHERE task_id = ? ORDER BY started_at ASC"
    ).bind(row.id).all<SessionRow>(),
    env.DB.prepare(
      "SELECT d.id, d.provider, d.provider_doc_id, d.title, d.url FROM task_documents td JOIN documents d ON d.id = td.document_id WHERE td.task_id = ?"
    ).bind(row.id).all<DocumentRow>(),
    env.DB.prepare(
      "SELECT l.id, l.name, l.color FROM entity_labels el JOIN labels l ON l.id = el.label_id WHERE el.entity_type = 'task' AND el.entity_id = ? ORDER BY l.name ASC"
    ).bind(row.id).all<LabelRow>(),
  ]);

  const now = Math.floor(Date.now() / 1000);
  let totalSeconds = 0;
  let activeSessionId: string | null = null;

  for (const s of sessions.results ?? []) {
    const start = Math.floor(new Date(s.started_at).getTime() / 1000);
    if (s.ended_at) {
      totalSeconds += Math.floor(new Date(s.ended_at).getTime() / 1000) - start;
    } else {
      totalSeconds += now - start;
      activeSessionId = s.id;
    }
  }

  const documents: Document[] = (docs.results ?? []).map((d) => ({
    id: d.id,
    provider: d.provider as Document["provider"],
    providerDocId: d.provider_doc_id,
    title: d.title,
    url: d.url,
  }));

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status as Task["status"],
    priority: row.priority as Task["priority"],
    eventId: row.event_id ?? undefined,
    start: row.start ?? undefined,
    end: row.end ?? undefined,
    labels: (labelRows.results ?? []).map((l) => ({ id: l.id, name: l.name, color: l.color })),
    documents,
    assignees: [],
    totalSeconds,
    activeSessionId,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── GET /api/tasks ────────────────────────────────────────────────────────────

taskRoutes.get("/", async (c) => {
  const sessionId = getCookie(c, "session");
  const session   = sessionId ? await kv.getSession(c.env.FLOWDOCS_KV, sessionId) : null;
  if (!session?.userId) return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);

  const statusFilter = c.req.query("status");
  const rows = statusFilter
    ? await c.env.DB.prepare(
        "SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC"
      ).bind(statusFilter).all<TaskRow>()
    : await c.env.DB.prepare(
        "SELECT * FROM tasks ORDER BY created_at DESC"
      ).all<TaskRow>();

  const tasks = await Promise.all((rows.results ?? []).map((r) => enrichTask(c.env, r)));
  return c.json(tasks);
});

// ── POST /api/tasks ───────────────────────────────────────────────────────────

taskRoutes.post("/", async (c) => {
  const sessionId = getCookie(c, "session");
  const session   = sessionId ? await kv.getSession(c.env.FLOWDOCS_KV, sessionId) : null;
  if (!session?.userId) return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);

  const body = await c.req.json<Partial<CreateTaskBody>>();
  if (!body.title?.trim()) {
    return c.json({ error: "Title is required", code: "BAD_REQUEST" }, 400);
  }

  const id     = crypto.randomUUID();
  const now    = new Date().toISOString();
  const start  = body.start  ?? now;
  const end    = body.end    ?? new Date(Date.now() + 3_600_000).toISOString();
  const status = body.status ?? "pending";

  await c.env.DB.prepare(`
    INSERT INTO tasks (id, title, description, status, priority, event_id, start, end, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    body.title.trim(),
    body.description ?? null,
    status,
    body.priority ?? "medium",
    body.eventId ?? null,
    body.eventId ? null : start,
    body.eventId ? null : end,
    null
  ).run();

  const row = await c.env.DB.prepare("SELECT * FROM tasks WHERE id = ?")
    .bind(id).first<TaskRow>();
  return c.json(await enrichTask(c.env, row!), 201);
});

// ── PATCH /api/tasks/:id ──────────────────────────────────────────────────────

taskRoutes.patch("/:id", async (c) => {
  const sessionId = getCookie(c, "session");
  const session   = sessionId ? await kv.getSession(c.env.FLOWDOCS_KV, sessionId) : null;
  if (!session?.userId) return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);

  const id  = c.req.param("id");
  const row = await c.env.DB.prepare("SELECT * FROM tasks WHERE id = ?")
    .bind(id).first<TaskRow>();
  if (!row) return c.json({ error: "Task not found", code: "NOT_FOUND" }, 404);

  const body = await c.req.json<Partial<UpdateTaskBody>>();

  const title       = body.title?.trim()   ?? row.title;
  const description = "description" in body ? (body.description ?? null) : row.description;
  const status      = body.status          ?? row.status;

  await c.env.DB.prepare(
    "UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?"
  ).bind(title, description, status, id).run();

  const updated = await c.env.DB.prepare("SELECT * FROM tasks WHERE id = ?")
    .bind(id).first<TaskRow>();
  return c.json(await enrichTask(c.env, updated!));
});

// ── DELETE /api/tasks/:id ─────────────────────────────────────────────────────

taskRoutes.delete("/:id", async (c) => {
  const sessionId = getCookie(c, "session");
  const session   = sessionId ? await kv.getSession(c.env.FLOWDOCS_KV, sessionId) : null;
  if (!session?.userId) return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);

  const id  = c.req.param("id");
  const row = await c.env.DB.prepare("SELECT id FROM tasks WHERE id = ?")
    .bind(id).first<{ id: string }>();
  if (!row) return c.json({ error: "Task not found", code: "NOT_FOUND" }, 404);

  await c.env.DB.prepare("DELETE FROM tasks WHERE id = ?").bind(id).run();
  return new Response(null, { status: 204 });
});

// ── POST /api/tasks/:id/sessions — start timer ────────────────────────────────

taskRoutes.post("/:id/sessions", async (c) => {
  const cookieId = getCookie(c, "session");
  const auth     = cookieId ? await kv.getSession(c.env.FLOWDOCS_KV, cookieId) : null;
  if (!auth?.userId) return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);

  const id  = c.req.param("id");
  const row = await c.env.DB.prepare("SELECT * FROM tasks WHERE id = ?")
    .bind(id).first<TaskRow>();
  if (!row) return c.json({ error: "Task not found", code: "NOT_FOUND" }, 404);

  const open = await c.env.DB.prepare(
    "SELECT id FROM task_sessions WHERE task_id = ? AND ended_at IS NULL"
  ).bind(id).first<{ id: string }>();
  if (open) return c.json({ error: "Timer already running", code: "TIMER_ALREADY_RUNNING" }, 409);

  const newSessionId = crypto.randomUUID();
  await c.env.DB.prepare(
    "INSERT INTO task_sessions (id, task_id, started_at) VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))"
  ).bind(newSessionId, id).run();

  const updated = await c.env.DB.prepare("SELECT * FROM tasks WHERE id = ?")
    .bind(id).first<TaskRow>();
  return c.json(await enrichTask(c.env, updated!), 201);
});

// ── PATCH /api/tasks/:id/sessions/:sessionId — pause timer ───────────────────

taskRoutes.patch("/:id/sessions/:sessionId", async (c) => {
  const cookieId = getCookie(c, "session");
  const auth     = cookieId ? await kv.getSession(c.env.FLOWDOCS_KV, cookieId) : null;
  if (!auth?.userId) return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);

  const taskId    = c.req.param("id");
  const sessionId = c.req.param("sessionId");

  const s = await c.env.DB.prepare(
    "SELECT id, ended_at FROM task_sessions WHERE id = ? AND task_id = ?"
  ).bind(sessionId, taskId).first<{ id: string; ended_at: string | null }>();

  if (!s) return c.json({ error: "Session not found", code: "NOT_FOUND" }, 404);
  if (s.ended_at) return c.json({ error: "Session already ended", code: "SESSION_ALREADY_ENDED" }, 409);

  await c.env.DB.prepare(
    "UPDATE task_sessions SET ended_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?"
  ).bind(sessionId).run();

  const updated = await c.env.DB.prepare("SELECT * FROM tasks WHERE id = ?")
    .bind(taskId).first<TaskRow>();
  return c.json(await enrichTask(c.env, updated!));
});

// ── POST /api/tasks/:id/documents — attach document ───────────────────────────

taskRoutes.post("/:id/documents", async (c) => {
  const cookieId = getCookie(c, "session");
  const auth     = cookieId ? await kv.getSession(c.env.FLOWDOCS_KV, cookieId) : null;
  if (!auth?.userId) return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);

  const taskId = c.req.param("id");
  const task   = await c.env.DB.prepare("SELECT id FROM tasks WHERE id = ?")
    .bind(taskId).first<{ id: string }>();
  if (!task) return c.json({ error: "Task not found", code: "NOT_FOUND" }, 404);

  const body = await c.req.json<{ providerDocId?: string; title?: string; url?: string }>();
  if (!body.providerDocId?.trim() || !body.title?.trim() || !body.url?.trim()) {
    return c.json({ error: "providerDocId, title, and url are required", code: "BAD_REQUEST" }, 400);
  }

  const docId = crypto.randomUUID();
  await c.env.DB.prepare(
    "INSERT OR IGNORE INTO documents (id, provider, provider_doc_id, title, url) VALUES (?, 'notion', ?, ?, ?)"
  ).bind(docId, body.providerDocId.trim(), body.title.trim(), body.url.trim()).run();

  const doc = await c.env.DB.prepare(
    "SELECT id FROM documents WHERE provider = 'notion' AND provider_doc_id = ?"
  ).bind(body.providerDocId.trim()).first<{ id: string }>();

  const existing = await c.env.DB.prepare(
    "SELECT 1 FROM task_documents WHERE task_id = ? AND document_id = ?"
  ).bind(taskId, doc!.id).first();
  if (existing) return c.json({ error: "Document already attached", code: "ALREADY_ATTACHED" }, 409);

  await c.env.DB.prepare(
    "INSERT INTO task_documents (task_id, document_id) VALUES (?, ?)"
  ).bind(taskId, doc!.id).run();

  const row = await c.env.DB.prepare("SELECT * FROM tasks WHERE id = ?")
    .bind(taskId).first<TaskRow>();
  return c.json(await enrichTask(c.env, row!), 201);
});

// ── PUT /api/tasks/:id/labels — replace all labels ───────────────────────────

taskRoutes.put("/:id/labels", async (c) => {
  const cookieId = getCookie(c, "session");
  const auth     = cookieId ? await kv.getSession(c.env.FLOWDOCS_KV, cookieId) : null;
  if (!auth?.userId) return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);

  const taskId = c.req.param("id");
  const task   = await c.env.DB.prepare("SELECT id FROM tasks WHERE id = ?")
    .bind(taskId).first<{ id: string }>();
  if (!task) return c.json({ error: "Task not found", code: "NOT_FOUND" }, 404);

  const body     = await c.req.json<{ labelIds?: unknown }>();
  const labelIds = Array.isArray(body.labelIds) ? (body.labelIds as string[]) : [];

  if (labelIds.length > 0) {
    const placeholders = labelIds.map(() => "?").join(",");
    const found = await c.env.DB.prepare(
      `SELECT id FROM labels WHERE id IN (${placeholders})`
    ).bind(...labelIds).all<{ id: string }>();
    if ((found.results ?? []).length !== labelIds.length) {
      return c.json({ error: "One or more label IDs are invalid", code: "INVALID_LABEL_IDS" }, 400);
    }
  }

  await c.env.DB.prepare(
    "DELETE FROM entity_labels WHERE entity_type = 'task' AND entity_id = ?"
  ).bind(taskId).run();

  for (const labelId of labelIds) {
    await c.env.DB.prepare(
      "INSERT INTO entity_labels (entity_type, entity_id, label_id) VALUES ('task', ?, ?)"
    ).bind(taskId, labelId).run();
  }

  const row = await c.env.DB.prepare("SELECT * FROM tasks WHERE id = ?")
    .bind(taskId).first<TaskRow>();
  return c.json(await enrichTask(c.env, row!));
});

// ── DELETE /api/tasks/:id/documents/:documentId — detach document ─────────────

taskRoutes.delete("/:id/documents/:documentId", async (c) => {
  const cookieId = getCookie(c, "session");
  const auth     = cookieId ? await kv.getSession(c.env.FLOWDOCS_KV, cookieId) : null;
  if (!auth?.userId) return c.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, 401);

  const taskId     = c.req.param("id");
  const documentId = c.req.param("documentId");

  const result = await c.env.DB.prepare(
    "DELETE FROM task_documents WHERE task_id = ? AND document_id = ?"
  ).bind(taskId, documentId).run();

  if (!result.meta.changes) {
    return c.json({ error: "Link not found", code: "NOT_FOUND" }, 404);
  }

  return new Response(null, { status: 204 });
});
