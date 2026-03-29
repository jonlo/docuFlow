import type { CalendarEvent } from "@flowdocs/shared";
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

      // ON CONFLICT preserves the existing primary key — safe for tasks linked via event_id FK
      await env.DB.prepare(`
        INSERT INTO events (id, google_event_id, calendar_id, title, description, start, end, all_day, html_link, color_id)
        VALUES (?, ?, 'primary', ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(google_event_id) DO UPDATE SET
          title       = excluded.title,
          description = excluded.description,
          start       = excluded.start,
          end         = excluded.end,
          all_day     = excluded.all_day,
          html_link   = excluded.html_link,
          color_id    = excluded.color_id,
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
        e.colorId  ?? null
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
