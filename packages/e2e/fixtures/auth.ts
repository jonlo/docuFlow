import { test as base } from 'playwright-bdd';
import type { Page } from '@playwright/test';

// ── Mock data ─────────────────────────────────────────────────────────────────

const TODAY = new Date();

function isoAt(date: Date, hour: number): string {
  const d = new Date(date);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

type MockDoc = {
  id: string;
  provider: string;
  providerDocId: string;
  title: string;
  url: string;
};

type MockTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  eventId?: string;
  start?: string;
  end?: string;
  labels: unknown[];
  documents: MockDoc[];
  assignees: unknown[];
  totalSeconds: number;
  activeSessionId: string | null;
  createdAt: string;
  updatedAt: string;
};

function makeTask(overrides: Partial<MockTask> = {}): MockTask {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: 'Existing Task',
    description: null,
    status: 'pending',
    priority: 'medium',
    start: isoAt(TODAY, 14),
    end: isoAt(TODAY, 15),
    labels: [],
    documents: [],
    assignees: [],
    totalSeconds: 0,
    activeSessionId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export const MOCK_EVENTS = [
  {
    id: 'evt-mock-1',
    googleEventId: 'google-evt-1',
    title: 'Team standup',
    start: isoAt(TODAY, 9),
    end: isoAt(TODAY, 10),
    allDay: false,
    userId: 'test-user',
    description: null,
    location: null,
    attendees: [],
    labels: [],
  },
];

export const MOCK_AUTH_STATUS = {
  google:     { provider: 'google',     connected: true,  accountEmail: 'test@example.com' },
  notion:     { provider: 'notion',     connected: true,  accountEmail: 'test@example.com' },
  confluence: { provider: 'confluence', connected: true },
  confluenceConnected: true,
};

export const DISCONNECTED_AUTH_STATUS = {
  google:     { provider: 'google',     connected: false },
  notion:     { provider: 'notion',     connected: false },
  confluence: { provider: 'confluence', connected: false },
  confluenceConnected: false,
};

export const MOCK_NOTION_RESULTS = [
  { id: 'notion-doc-1', title: 'Notion Doc Alpha', url: 'https://notion.so/alpha' },
  { id: 'notion-doc-2', title: 'Notion Doc Beta',  url: 'https://notion.so/beta'  },
];

export const MOCK_CONFLUENCE_RESULTS = [
  { id: 'conf-page-1', title: 'Confluence Page One', url: 'https://example.atlassian.net/wiki/one' },
  { id: 'conf-page-2', title: 'Confluence Page Two', url: 'https://example.atlassian.net/wiki/two' },
];

// ── Scenario state (shared across steps within one scenario) ─────────────────

export type ScenarioState = {
  calendarHeader?: string | null;
  firstSearchResultTitle?: string | null;
  firstTaskTitle?: string | null;
};

// ── Fixtures ──────────────────────────────────────────────────────────────────

type Fixtures = {
  authenticatedPage: Page;
  state: ScenarioState;
};

export const test = base.extend<Fixtures>({
  state: async ({}, use) => {
    await use({});
  },

  authenticatedPage: async ({ page }, use) => {
    // In-memory task store — stateful across CRUD operations within one scenario
    const tasks: MockTask[] = [makeTask()];

    function json(
      route: Parameters<Parameters<typeof page.route>[1]>[0],
      status: number,
      body: unknown,
    ) {
      return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    }

    await page.route('**/api/auth/status', route => json(route, 200, MOCK_AUTH_STATUS));
    await page.route('**/api/events*',     route => json(route, 200, MOCK_EVENTS));

    await page.route(/\/api\/tasks/, async route => {
      const method   = route.request().method();
      const pathname = new URL(route.request().url()).pathname;
      const after    = pathname.replace(/^.*\/api\/tasks\/?/, '');
      const parts    = after.split('/').filter(Boolean);
      const taskId   = parts[0];
      const sub      = parts[1]; // 'documents' | 'sessions' | 'labels' | undefined
      const subId    = parts[2];

      if (!taskId) {
        if (method === 'GET')  return json(route, 200, tasks);
        if (method === 'POST') {
          const body = route.request().postDataJSON() as Partial<MockTask>;
          const t = makeTask({ ...body });
          tasks.push(t);
          return json(route, 201, t);
        }
      }

      if (taskId && !sub) {
        if (method === 'PATCH') {
          const body = route.request().postDataJSON() as Partial<MockTask>;
          const idx = tasks.findIndex(t => t.id === taskId);
          if (idx === -1) return json(route, 404, { error: 'Not found', code: 'NOT_FOUND' });
          tasks[idx] = { ...tasks[idx], ...body, updatedAt: new Date().toISOString() };
          return json(route, 200, tasks[idx]);
        }
        if (method === 'DELETE') {
          const idx = tasks.findIndex(t => t.id === taskId);
          if (idx !== -1) tasks.splice(idx, 1);
          return route.fulfill({ status: 204, body: '' });
        }
      }

      if (taskId && sub === 'labels') {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return json(route, 404, { error: 'Not found', code: 'NOT_FOUND' });
        return json(route, 200, task);
      }

      if (taskId && sub === 'documents') {
        if (method === 'POST') {
          const body = route.request().postDataJSON() as Omit<MockDoc, 'id'>;
          const task = tasks.find(t => t.id === taskId);
          if (!task) return json(route, 404, { error: 'Not found', code: 'NOT_FOUND' });
          const doc: MockDoc = { id: crypto.randomUUID(), ...body };
          task.documents.push(doc);
          return json(route, 201, task);
        }
        if (method === 'DELETE' && subId) {
          const task = tasks.find(t => t.id === taskId);
          if (task) task.documents = task.documents.filter(d => d.id !== subId && d.providerDocId !== subId);
          return route.fulfill({ status: 204, body: '' });
        }
      }

      return route.continue();
    });

    await page.route('**/api/notion/search*',     route => json(route, 200, MOCK_NOTION_RESULTS));
    await page.route('**/api/confluence/search*', route => json(route, 200, MOCK_CONFLUENCE_RESULTS));
    await page.route('**/api/labels*',            route => json(route, 200, []));

    await use(page);
  },
});

export { expect } from '@playwright/test';
