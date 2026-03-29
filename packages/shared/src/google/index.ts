// ── Integrations ──────────────────────────────────────────────────────────────

export type IntegrationProvider = "google" | "notion" | "confluence";

export interface Integration {
  provider: IntegrationProvider;
  connected: boolean;
  accountEmail?: string;
  expiresAt?: number;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthStatus {
  google: Integration;
  notion: Integration;
  confluence: Integration;
}

// ── Calendar ──────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  googleEventId: string;
  calendarId: string;
  title: string;
  description?: string;
  start: string;      // ISO 8601
  end: string;        // ISO 8601
  allDay: boolean;
  htmlLink?: string;
  colorId?: string;
}

export interface CalendarList {
  id: string;
  summary: string;
  backgroundColor?: string;
  primary?: boolean;
}

export interface CalendarEventsQuery {
  timeMin: string;
  timeMax: string;
  calendarId?: string;
}
