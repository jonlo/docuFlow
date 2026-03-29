# FlowDocs — Project Context

## What is this?

A productivity web app combining calendar view, task management, and document linking.
Users see their Google Calendar events, create tasks (linked or not to events),
and attach documents from Notion or Confluence to those tasks.

**Target**: web app first → packaged as native macOS app with Tauri later.

---

## Key decisions

- **Monorepo** with pnpm workspaces: `packages/web`, `packages/api`, `packages/shared`
- **Frontend**: React 18 + TypeScript + Vite → deploys to **Cloudflare Pages**
- **Backend**: Hono + TypeScript → deploys to **Cloudflare Workers**
- **Shared types**: `packages/shared` — imported by both web and api, no runtime deps
- **No vendor lock-in**: Hono runs on Node/Deno/Bun too, zero Cloudflare-specific APIs in business logic
- **State management**: Zustand (UI state) + TanStack Query (server/async state)
- **Styling**: Tailwind CSS + shadcn/ui
- **Everything is TypeScript** — no .js files, ever
- **Path alias**: `@/` maps to `src/` in both web and api packages

---

## Integrations (priority order)

1. **Google Calendar** — OAuth 2.0, handled entirely by the backend Worker
2. **Notion** — Internal integration token (user pastes it into the app)
3. **Confluence** — API token + Basic auth (Phase 2)

---

## Auth architecture

The Google client secret lives **only** in the Worker, never in the frontend.

Flow:
1. Frontend calls `GET /api/auth/google/url` → gets consent URL
2. Frontend opens URL in a new window (system browser)
3. Google redirects to `GET /api/auth/google/callback` (Worker)
4. Worker exchanges code for tokens, stores in Cloudflare KV, sets session cookie
5. Frontend polls `GET /api/auth/status` to detect success and close the popup

Sessions are stored in KV as `session:{uuid}` with a 7-day TTL.

---

## Environment variables

**packages/api** (Cloudflare Worker):
- `GOOGLE_CLIENT_ID` — via `wrangler secret put`
- `GOOGLE_CLIENT_SECRET` — via `wrangler secret put`
- `SESSION_SECRET` — via `wrangler secret put`
- `FLOWDOCS_KV` — KV namespace binding in wrangler.toml

**packages/web** (Vite):
- `VITE_API_URL` — Worker URL (`http://localhost:8787` in dev)

---

## API conventions

- All routes prefixed with `/api/`
- Error shape: `{ error: string, code: string }`
- Dates always as ISO 8601 strings over the wire (never Date objects)
- Auth required routes read session from `session` cookie

---

## Coding conventions

- Named exports only — except React components and the Hono app (default export)
- Explicit return types on all exported functions
- No `any` — use `unknown` and narrow properly
- Types shared between web and api go in `packages/shared/src/index.ts`
- Types used only in web go in `packages/web/src/types/`

---

## Local dev

```bash
pnpm install

# Frontend → http://localhost:5173
pnpm --filter @flowdocs/web dev

# Backend Worker → http://localhost:8787
pnpm --filter @flowdocs/api dev

# Both simultaneously (root)
pnpm dev
```

---

## Deployment

- **Frontend**: Cloudflare Pages — connected to GitHub repo, auto-deploys on push to `main`
- **Backend**: `wrangler deploy` from `packages/api`

---

## Setup checklist (one-time)

- [ ] `gh repo create flowdocs --private` and push
- [ ] `wrangler login`
- [ ] `wrangler kv:namespace create FLOWDOCS_KV` → paste ID into `wrangler.toml`
- [ ] `wrangler secret put GOOGLE_CLIENT_ID`
- [ ] `wrangler secret put GOOGLE_CLIENT_SECRET`
- [ ] `wrangler secret put SESSION_SECRET`
- [ ] Create Google Cloud project → enable Calendar API → create OAuth 2.0 credentials
- [ ] Connect Cloudflare Pages to GitHub repo in CF dashboard

---

## What's next (build order)

1. Implement `AuthGate.tsx` + `IntegrationBadge.tsx`
2. Implement `CalendarView.tsx` using react-big-calendar
3. Wire up Google Calendar events end-to-end
4. Implement `TaskPanel.tsx` (create/edit tasks, link to events)
5. Implement Notion document search + attach to tasks
6. Confluence integration (Phase 2)
7. Package as macOS app with Tauri (Phase 3)

---

## Data model (D1 — SQLite)

Schema file: `packages/api/schema.sql`

### Entities

**events** — mirror of Google Calendar events. Google is source of truth, we sync on load and write back on update.
- `google_event_id` — unique, used to reconcile with Google API
- `start + end` — ISO 8601 strings always

**tasks** — core entity, two modes:
- Dependent (`event_id IS NOT NULL`) → bound to an event, deleted in cascade if event is deleted
- Independent (`event_id IS NULL`) → has its own `start + end`, shown as a block on the calendar
- DB CHECK constraint enforces: if `event_id IS NULL` then `start + end` must both exist

**Drag task off event behavior** (application layer, not DB):
1. Copy `start + end` from the event into the task
2. Set `event_id = NULL`
This must happen in a single transaction before any delete.

**documents** — reference only, no content stored
- `UNIQUE(provider, provider_doc_id)` — same doc linked to multiple tasks reuses one record via `task_documents`
- `provider` ∈ ('notion', 'confluence')

**users** — Google accounts only (google_id = sub claim from OAuth)

**teams** — name + color, members via `team_members(team_id, user_id, role)`

**labels** — name + color, applied via polymorphic pivot

### Pivot tables

| Table | Purpose |
|---|---|
| `entity_labels` | Polymorphic: (entity_type, entity_id, label_id) |
| `entity_users` | Polymorphic: (entity_type, entity_id, user_id, role) |
| `task_documents` | Many-to-many: tasks ↔ documents |
| `team_members` | Many-to-many: teams ↔ users |

**entity_type values:**
- `entity_labels`: 'event' | 'task' | 'document' | 'user'
- `entity_users`: 'event' | 'task' | 'document'

### Cloudflare storage split

- **KV** (`FLOWDOCS_KV`) — sessions and OAuth tokens only
- **D1** (`flowdocs-db`) — all relational data (tasks, events, documents, users, labels, teams)

### Running the schema

```bash
# Create the D1 database
wrangler d1 create flowdocs-db

# Apply schema
wrangler d1 execute flowdocs-db --file=packages/api/schema.sql

# Local dev (runs against a local SQLite file)
wrangler d1 execute flowdocs-db --local --file=packages/api/schema.sql
```
