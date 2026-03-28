PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS labels (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS entity_labels (
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  label_id    TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (entity_type, entity_id, label_id)
);
CREATE INDEX IF NOT EXISTS idx_entity_labels_label  ON entity_labels(label_id);
CREATE INDEX IF NOT EXISTS idx_entity_labels_entity ON entity_labels(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  google_id  TEXT UNIQUE NOT NULL,
  email      TEXT NOT NULL,
  name       TEXT NOT NULL,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS entity_users (
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'assignee',
  PRIMARY KEY (entity_type, entity_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_entity_users_user   ON entity_users(user_id);
CREATE INDEX IF NOT EXISTS idx_entity_users_entity ON entity_users(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS teams (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role    TEXT NOT NULL DEFAULT 'member',
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS events (
  id              TEXT PRIMARY KEY,
  google_event_id TEXT UNIQUE NOT NULL,
  calendar_id     TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  start           TEXT NOT NULL,
  end             TEXT NOT NULL,
  all_day         INTEGER NOT NULL DEFAULT 0,
  html_link       TEXT,
  color_id        TEXT,
  synced_at       TEXT NOT NULL DEFAULT (datetime('now')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_events_start  ON events(start);
CREATE INDEX IF NOT EXISTS idx_events_google ON events(google_event_id);

CREATE TABLE IF NOT EXISTS tasks (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK(status IN ('pending','in_progress','done','blocked')),
  priority    TEXT NOT NULL DEFAULT 'medium'
                CHECK(priority IN ('low','medium','high')),
  event_id    TEXT REFERENCES events(id) ON DELETE CASCADE,
  start       TEXT,
  end         TEXT,
  created_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (event_id IS NOT NULL OR (start IS NOT NULL AND end IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_tasks_event  ON tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_tasks_start  ON tasks(start);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

CREATE TABLE IF NOT EXISTS documents (
  id              TEXT PRIMARY KEY,
  provider        TEXT NOT NULL CHECK(provider IN ('notion','confluence')),
  provider_doc_id TEXT NOT NULL,
  title           TEXT NOT NULL,
  url             TEXT NOT NULL,
  last_updated    TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(provider, provider_doc_id)
);

CREATE TABLE IF NOT EXISTS task_documents (
  task_id     TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  linked_at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (task_id, document_id)
);
CREATE INDEX IF NOT EXISTS idx_task_documents_doc ON task_documents(document_id);

CREATE TRIGGER IF NOT EXISTS trg_labels_updated    AFTER UPDATE ON labels    BEGIN UPDATE labels    SET updated_at = datetime('now') WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS trg_users_updated     AFTER UPDATE ON users     BEGIN UPDATE users     SET updated_at = datetime('now') WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS trg_teams_updated     AFTER UPDATE ON teams     BEGIN UPDATE teams     SET updated_at = datetime('now') WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS trg_events_updated    AFTER UPDATE ON events    BEGIN UPDATE events    SET updated_at = datetime('now') WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS trg_tasks_updated     AFTER UPDATE ON tasks     BEGIN UPDATE tasks     SET updated_at = datetime('now') WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS trg_documents_updated AFTER UPDATE ON documents BEGIN UPDATE documents SET updated_at = datetime('now') WHERE id = NEW.id; END;
