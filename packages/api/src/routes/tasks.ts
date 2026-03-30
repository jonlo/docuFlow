import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import type { Env } from "../types";
import type { Task, CreateTaskBody, UpdateTaskBody } from "@flowdocs/shared";
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

async function enrichTask(env: Env, row: TaskRow): Promise<Task> {
  const sessions = await env.DB.prepare(
    "SELECT id, task_id, started_at, ended_at FROM task_sessions WHERE task_id = ? ORDER BY started_at ASC"
  ).bind(row.id).all<SessionRow>();

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

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status as Task["status"],
    priority: row.priority as Task["priority"],
    eventId: row.event_id ?? undefined,
    start: row.start ?? undefined,
    end: row.end ?? undefined,
    labels: [],
    documents: [],
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
