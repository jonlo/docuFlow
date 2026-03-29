import type { CalendarEvent, CreateEventBody, UpdateEventBody } from "@flowdocs/shared";
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

function toCalendarEvent(row: Record<string, unknown>): CalendarEvent {
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
  };
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

  return (result.results ?? []).map(toCalendarEvent);
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
  return toCalendarEvent(row!);
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
  return toCalendarEvent(row!);
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
