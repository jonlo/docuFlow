-- ─────────────────────────────────────────────────────────────────────────────
-- FlowDocs — D1 Schema
-- Run via: wrangler d1 execute flowdocs-db --file=schema.sql
-- ─────────────────────────────────────────────────────────────────────────────

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ── Labels ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS labels (
  id         TEXT PRIMARY KEY,           -- nanoid
  name       TEXT NOT NULL,
  color      TEXT NOT NULL,              -- hex color e.g. '#6366f1'
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Polymorphic pivot: one label → many entity types
-- entity_type ∈ ('event', 'task', 'document', 'user')
CREATE TABLE IF NOT EXISTS entity_labels (
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  label_id    TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (entity_type, entity_id, label_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_labels_label  ON entity_labels(label_id);
CREATE INDEX IF NOT EXISTS idx_entity_labels_entity ON entity_labels(entity_type, entity_id);

-- ── Users ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,           -- nanoid (internal)
  google_id  TEXT UNIQUE NOT NULL,       -- Google sub claim
  email      TEXT NOT NULL,
  name       TEXT NOT NULL,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Polymorphic pivot: assign users to events, tasks or documents
-- entity_type ∈ ('event', 'task', 'document')
-- role e.g. 'owner' | 'assignee' | 'viewer'
CREATE TABLE IF NOT EXISTS entity_users (
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'assignee',
  PRIMARY KEY (entity_type, entity_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_users_user   ON entity_users(user_id);
CREATE INDEX IF NOT EXISTS idx_entity_users_entity ON entity_users(entity_type, entity_id);

-- ── Teams ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS teams (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id    TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member',  -- 'owner' | 'member'
  PRIMARY KEY (team_id, user_id)
);

-- ── Events ───────────────────────────────────────────────────────────────────
-- Mirror of Google Calendar events.
-- Source of truth is always Google — we sync on load and write back on update.

CREATE TABLE IF NOT EXISTS events (
  id              TEXT PRIMARY KEY,      -- nanoid (internal)
  google_event_id TEXT UNIQUE NOT NULL,  -- Google Calendar event ID
  calendar_id     TEXT NOT NULL,         -- Google Calendar ID (e.g. 'primary')
  title           TEXT NOT NULL,
  description     TEXT,
  start           TEXT NOT NULL,         -- ISO 8601
  end             TEXT NOT NULL,         -- ISO 8601
  all_day         INTEGER NOT NULL DEFAULT 0,  -- boolean (0|1)
  html_link       TEXT,                  -- link back to Google Calendar
  color_id        TEXT,                  -- Google color ID
  synced_at       TEXT NOT NULL DEFAULT (datetime('now')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_start ON events(start);
CREATE INDEX IF NOT EXISTS idx_events_google ON events(google_event_id);

-- ── Tasks ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tasks (
  id          TEXT PRIMARY KEY,          -- nanoid
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK(status IN ('pending', 'in_progress', 'done', 'blocked')),
  priority    TEXT NOT NULL DEFAULT 'medium'
                CHECK(priority IN ('low', 'medium', 'high')),

  -- Temporal fields
  -- If event_id is set, the task is bound to that event.
  -- If event_id is NULL, start + end define the block on the calendar.
  event_id    TEXT REFERENCES events(id) ON DELETE CASCADE,
  start       TEXT,                      -- ISO 8601 (used when event_id IS NULL)
  end         TEXT,                      -- ISO 8601 (used when event_id IS NULL)

  -- When dragging a task off an event:
  --   1. Set event_id = NULL
  --   2. Set start + end from the former event's start + end
  -- This is enforced at the application layer, not here.

  created_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),

  -- Constraint: an independent task (no event) must have start + end
  CHECK (
    event_id IS NOT NULL
    OR (start IS NOT NULL AND end IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_tasks_event  ON tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_tasks_start  ON tasks(start);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- ── Documents ─────────────────────────────────────────────────────────────────
-- We store a reference only — no content is fetched or stored locally.

CREATE TABLE IF NOT EXISTS documents (
  id              TEXT PRIMARY KEY,      -- nanoid
  provider        TEXT NOT NULL
                    CHECK(provider IN ('notion', 'confluence')),
  provider_doc_id TEXT NOT NULL,         -- ID used by the provider's API
  title           TEXT NOT NULL,
  url             TEXT NOT NULL,         -- canonical URL to open in browser
  last_updated    TEXT,                  -- ISO 8601, from provider metadata
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(provider, provider_doc_id)      -- prevent duplicate links
);

-- ── Task ↔ Document (many-to-many) ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS task_documents (
  task_id     TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  linked_at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (task_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_task_documents_doc ON task_documents(document_id);

-- ── Triggers: updated_at ──────────────────────────────────────────────────────

CREATE TRIGGER IF NOT EXISTS trg_labels_updated
  AFTER UPDATE ON labels
  BEGIN UPDATE labels SET updated_at = datetime('now') WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_users_updated
  AFTER UPDATE ON users
  BEGIN UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_teams_updated
  AFTER UPDATE ON teams
  BEGIN UPDATE teams SET updated_at = datetime('now') WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_events_updated
  AFTER UPDATE ON events
  BEGIN UPDATE events SET updated_at = datetime('now') WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_tasks_updated
  AFTER UPDATE ON tasks
  BEGIN UPDATE tasks SET updated_at = datetime('now') WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_documents_updated
  AFTER UPDATE ON documents
  BEGIN UPDATE documents SET updated_at = datetime('now') WHERE id = NEW.id; END;
