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
  start: string;           // ISO 8601
  end: string;             // ISO 8601
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

// ── Labels ────────────────────────────────────────────────────────────────────

export interface Label {
  id: string;
  name: string;
  color: string;           // hex e.g. '#6366f1'
}

export type EntityType = "event" | "task" | "document" | "user";

// ── Users ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export type EntityUserRole = "owner" | "assignee" | "viewer";

// ── Teams ─────────────────────────────────────────────────────────────────────

export interface Team {
  id: string;
  name: string;
  color: string;
}

// ── Documents ─────────────────────────────────────────────────────────────────

export interface Document {
  id: string;
  provider: "notion" | "confluence";
  providerDocId: string;
  title: string;
  url: string;
  lastUpdated?: string;    // ISO 8601
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export type TaskStatus   = "pending" | "in_progress" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  // If eventId is set → dependent task (cascade delete with event)
  // If eventId is null → independent task, start+end are required
  eventId?: string;
  start?: string;          // ISO 8601 — required when eventId is null
  end?: string;            // ISO 8601 — required when eventId is null
  labels: Label[];
  documents: Document[];
  assignees: User[];
  createdAt: string;
  updatedAt: string;
}

// ── API shapes ────────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code: string;
}

export interface CalendarEventsQuery {
  timeMin: string;
  timeMax: string;
  calendarId?: string;
}

export interface DocumentSearchQuery {
  provider: IntegrationProvider;
  query: string;
}

export interface CreateTaskBody {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  eventId?: string;
  start?: string;
  end?: string;
}

export interface UpdateTaskBody extends Partial<CreateTaskBody> {
  // When dragging a task off an event:
  // send { eventId: null, start: <former event start>, end: <former event end> }
}
