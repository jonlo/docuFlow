import type { CalendarEvent, CreateEventBody, Label, UpdateEventBody } from "@flowdocs/shared";
import type { Env } from "../types";
import * as googleApi from "./api";
import * as kv from "./kv";

const DAYS_BACK    = 30;
const DAYS_FORWARD = 60;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function rollingWindow(): { timeMin: string; timeMax: string } {
  const now = Date.now();
  return {
    timeMin: new Date(now - DAYS_BACK    * 86_400_000).toISOString(),
    timeMax: new Date(now + DAYS_FORWARD * 86_400_000).toISOString(),
  };
}

function toCalendarEvent(row: Record<string, unknown>, labels: Label[] = []): CalendarEvent {
  const attendeesRaw = row["attendees"] as string | null;
  return {
    id:           row["id"]              as string,
    googleEventId: row["google_event_id"] as string,
    calendarId:   row["calendar_id"]     as string,
    title:        row["title"]           as string,
    description:  (row["description"]   as string | null) ?? undefined,
    start:        row["start"]           as string,
    end:          row["end"]             as string,
    allDay:       row["all_day"] === 1,
    htmlLink:     (row["html_link"]      as string | null) ?? undefined,
    colorId:      (row["color_id"]       as string | null) ?? undefined,
    attendees:    attendeesRaw ? (JSON.parse(attendeesRaw) as CalendarEvent["attendees"]) : undefined,
    labels,
  };
}

// Fetch labels for all events in a time window — avoids IN (...) with many variables
async function fetchLabelsForWindow(
  env: Env,
  timeMin: string,
  timeMax: string
): Promise<Map<string, Label[]>> {
  const map = new Map<string, Label[]>();
  const rows = await env.DB.prepare(`
    SELECT el.entity_id AS event_id, l.id, l.name, l.color
    FROM entity_labels el
    JOIN labels l ON l.id = el.label_id
    JOIN events e ON e.id = el.entity_id
    WHERE el.entity_type = 'event' AND e.start >= ? AND e.start <= ?
    ORDER BY l.name ASC
  `).bind(timeMin, timeMax).all<{ event_id: string; id: string; name: string; color: string }>();

  for (const r of rows.results ?? []) {
    const arr = map.get(r.event_id) ?? [];
    arr.push({ id: r.id, name: r.name, color: r.color });
    map.set(r.event_id, arr);
  }
  return map;
}

// Fetch labels for a single event ID (safe — 1 variable)
async function fetchLabelsForEvent(env: Env, eventId: string): Promise<Label[]> {
  const rows = await env.DB.prepare(`
    SELECT l.id, l.name, l.color
    FROM entity_labels el
    JOIN labels l ON l.id = el.label_id
    WHERE el.entity_type = 'event' AND el.entity_id = ?
    ORDER BY l.name ASC
  `).bind(eventId).all<Label>();
  return rows.results ?? [];
}

export async function syncAndReturnEvents(
  userId: string,
  accessToken: string,
  env: Env
): Promise<CalendarEvent[]> {
  const syncedAt  = await kv.getSyncedAt(env.FLOWDOCS_KV, userId);
  const cacheWarm = syncedAt !== null && Date.now() - syncedAt < CACHE_TTL_MS;

  if (!cacheWarm) {
    const { timeMin, timeMax } = rollingWindow();
    const googleEvents = await googleApi.listCalendarEvents(accessToken, timeMin, timeMax);

    for (const e of googleEvents) {
      const allDay = !e.start.dateTime;
      const start  = e.start.dateTime ?? e.start.date ?? "";
      const end    = e.end.dateTime   ?? e.end.date   ?? "";

      const attendeesJson = e.attendees?.length
        ? JSON.stringify(e.attendees.map((a) => ({ email: a.email, name: a.displayName })))
        : null;

      // ON CONFLICT preserves the existing primary key — safe for tasks linked via event_id FK
      await env.DB.prepare(`
        INSERT INTO events (id, google_event_id, calendar_id, title, description, start, end, all_day, html_link, color_id, attendees)
        VALUES (?, ?, 'primary', ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(google_event_id) DO UPDATE SET
          title       = excluded.title,
          description = excluded.description,
          start       = excluded.start,
          end         = excluded.end,
          all_day     = excluded.all_day,
          html_link   = excluded.html_link,
          color_id    = excluded.color_id,
          attendees   = excluded.attendees,
          synced_at   = datetime('now')
      `).bind(
        crypto.randomUUID(),
        e.id,
        e.summary ?? "(No title)",
        e.description ?? null,
        start,
        end,
        allDay ? 1 : 0,
        e.htmlLink ?? null,
        e.colorId  ?? null,
        attendeesJson
      ).run();
    }

    await kv.setSyncedAt(env.FLOWDOCS_KV, userId);
  }

  const { timeMin, timeMax } = rollingWindow();
  const result = await env.DB.prepare(
    "SELECT * FROM events WHERE start >= ? AND start <= ? ORDER BY start ASC"
  ).bind(timeMin, timeMax).all<Record<string, unknown>>();

  const rows = result.results ?? [];
  const labelsMap = await fetchLabelsForWindow(env, timeMin, timeMax);

  return rows.map((r) => toCalendarEvent(r, labelsMap.get(r["id"] as string) ?? []));
}

export async function createEvent(
  userId: string,
  accessToken: string,
  body: CreateEventBody,
  env: Env
): Promise<CalendarEvent> {
  const googleEvent = await googleApi.createCalendarEvent(accessToken, body);
  const allDay = !googleEvent.start.dateTime;
  const start  = googleEvent.start.dateTime ?? googleEvent.start.date ?? "";
  const end    = googleEvent.end.dateTime   ?? googleEvent.end.date   ?? "";
  const newId  = crypto.randomUUID();

  const attendeesJson = googleEvent.attendees?.length
    ? JSON.stringify(googleEvent.attendees.map((a) => ({ email: a.email, name: a.displayName })))
    : null;

  await env.DB.prepare(`
    INSERT INTO events (id, google_event_id, calendar_id, title, description, start, end, all_day, html_link, color_id, attendees)
    VALUES (?, ?, 'primary', ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(google_event_id) DO UPDATE SET
      title = excluded.title, start = excluded.start, end = excluded.end,
      all_day = excluded.all_day, attendees = excluded.attendees, synced_at = datetime('now')
  `).bind(newId, googleEvent.id, googleEvent.summary ?? body.title, googleEvent.description ?? null,
    start, end, allDay ? 1 : 0, googleEvent.htmlLink ?? null, googleEvent.colorId ?? null, attendeesJson).run();

  await env.FLOWDOCS_KV.delete(`synced_at:${userId}`);

  const row = await env.DB.prepare("SELECT * FROM events WHERE google_event_id = ?")
    .bind(googleEvent.id).first<Record<string, unknown>>();
  const savedId = row!["id"] as string;
  return toCalendarEvent(row!, await fetchLabelsForEvent(env, savedId));
}

export async function updateEvent(
  id: string,
  userId: string,
  accessToken: string,
  body: UpdateEventBody,
  env: Env
): Promise<CalendarEvent> {
  const existing = await env.DB.prepare("SELECT * FROM events WHERE id = ?")
    .bind(id).first<Record<string, unknown>>();
  if (!existing) throw Object.assign(new Error("Event not found"), { code: "NOT_FOUND" });

  const googleEvent = await googleApi.updateCalendarEvent(
    accessToken, existing["google_event_id"] as string, body
  );
  const start = googleEvent.start.dateTime ?? googleEvent.start.date ?? (existing["start"] as string);
  const end   = googleEvent.end.dateTime   ?? googleEvent.end.date   ?? (existing["end"]   as string);

  const attendeesJson = googleEvent.attendees?.length
    ? JSON.stringify(googleEvent.attendees.map((a) => ({ email: a.email, name: a.displayName })))
    : (existing["attendees"] as string | null);

  await env.DB.prepare(`
    UPDATE events SET title = ?, start = ?, end = ?, attendees = ?, synced_at = datetime('now')
    WHERE id = ?
  `).bind(googleEvent.summary ?? (existing["title"] as string), start, end, attendeesJson, id).run();

  await env.FLOWDOCS_KV.delete(`synced_at:${userId}`);

  const row = await env.DB.prepare("SELECT * FROM events WHERE id = ?")
    .bind(id).first<Record<string, unknown>>();
  return toCalendarEvent(row!, await fetchLabelsForEvent(env, id));
}

export async function deleteEvent(
  id: string,
  userId: string,
  accessToken: string,
  env: Env
): Promise<void> {
  const existing = await env.DB.prepare("SELECT google_event_id FROM events WHERE id = ?")
    .bind(id).first<{ google_event_id: string }>();
  if (!existing) throw Object.assign(new Error("Event not found"), { code: "NOT_FOUND" });

  await googleApi.deleteCalendarEvent(accessToken, existing.google_event_id);
  await env.DB.prepare("DELETE FROM events WHERE id = ?").bind(id).run();
  await env.FLOWDOCS_KV.delete(`synced_at:${userId}`);
}

export async function setEventLabels(
  eventId: string,
  labelIds: string[],
  env: Env
): Promise<CalendarEvent> {
  const existing = await env.DB.prepare("SELECT * FROM events WHERE id = ?")
    .bind(eventId).first<Record<string, unknown>>();
  if (!existing) throw Object.assign(new Error("Event not found"), { code: "NOT_FOUND" });

  // Validate all label IDs exist
  if (labelIds.length > 0) {
    const placeholders = labelIds.map(() => "?").join(",");
    const found = await env.DB.prepare(
      `SELECT id FROM labels WHERE id IN (${placeholders})`
    ).bind(...labelIds).all<{ id: string }>();
    if ((found.results ?? []).length !== labelIds.length) {
      throw Object.assign(new Error("One or more label IDs are invalid"), { code: "INVALID_LABEL_IDS" });
    }
  }

  // Replace all associations atomically
  await env.DB.prepare(
    "DELETE FROM entity_labels WHERE entity_type = 'event' AND entity_id = ?"
  ).bind(eventId).run();

  for (const labelId of labelIds) {
    await env.DB.prepare(
      "INSERT INTO entity_labels (entity_type, entity_id, label_id) VALUES ('event', ?, ?)"
    ).bind(eventId, labelId).run();
  }

  return toCalendarEvent(existing, await fetchLabelsForEvent(env, eventId));
}
