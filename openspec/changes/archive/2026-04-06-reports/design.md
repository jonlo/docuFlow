## Context

FlowDocs already fetches all tasks (`GET /api/tasks`) and calendar events (`GET /api/events`) and caches them in TanStack Query. The data includes task status, `totalSeconds` tracked, labels, start/end dates, and event labels. All the raw data needed for reporting is already available client-side — no new API is required.

The app uses Zustand for page navigation (`activePage`) and Tailwind CSS for styling. There is currently no charting library in the project.

## Goals / Non-Goals

**Goals:**
- Add a Reports page accessible from the sidebar with two sub-views: Task Reports and Event Reports
- Task Reports: time spent per task (bar chart), task status distribution (donut chart), task completion trend over time (line chart)
- Event Reports: event count by time range (bar chart), events grouped by label (bar/donut chart)
- Label filter (multi-select) applied across all charts in the active view
- Time range selector: Daily, Weekly, Monthly, Yearly — controls how data is bucketed
- All data derived client-side from existing query caches

**Non-Goals:**
- No new API endpoints or backend changes
- No export/download of reports
- No cross-tab comparison (task vs event on the same chart)
- No user-specific vs team-wide breakdown

## Decisions

### Charting library: Recharts
**Decision:** Use [Recharts](https://recharts.org) (`recharts` npm package).

**Rationale:** Recharts is the most commonly used chart library in the React ecosystem. It is composable, tree-shakeable, and its declarative API fits naturally with React. It has first-class TypeScript support and renders SVG — consistent with the app's design. Alternative considered: `chart.js` + `react-chartjs-2` — heavier bundle, imperative API, less React-idiomatic.

### Data aggregation: client-side with `useMemo`
**Decision:** Aggregate and bucket data inside the `ReportsPage` component using `useMemo`, reading directly from `useTasks()` and `useCalendarEvents()`.

**Rationale:** The data volumes are small (hundreds of tasks/events max). No server round-trip needed, no extra loading state, and the result is always in sync with the live cache. If data grows significantly, aggregation can be moved to a Worker later without changing the API.

### Page structure: single `ReportsPage` with tab switcher
**Decision:** One `ReportsPage` component with a "Tasks" / "Events" tab bar at the top, shared label filter and time range selector below it, then the charts.

**Rationale:** Mirrors the existing `TaskListView` layout pattern. Keeps navigation simple — one `activePage` value (`"reports"`), one component.

### Label filter: client-side multi-select
**Decision:** A multi-select dropdown populated from `useLabels()`. When labels are selected, only tasks/events that have at least one of those labels are included in the aggregations.

**Rationale:** Labels are already fetched globally. No additional state management needed.

### Time range bucketing
**Decision:** Four ranges — Daily (last 30 days), Weekly (last 12 weeks), Monthly (last 12 months), Yearly (last 5 years). Buckets are computed with `date-fns` (already a project dependency).

**Rationale:** Covers the user's explicit request. `date-fns` is already used throughout the project.

## Risks / Trade-offs

- **Bundle size increase** → Recharts adds ~150 KB (gzipped ~50 KB). Acceptable for a productivity app. Mitigate by importing only the chart types used.
- **Large task/event counts** → `useMemo` recomputation could be slow with thousands of items. Mitigation: add `useDeferredValue` around the filter inputs if jank is observed; out of scope for MVP.
- **No real-time data** → Reports reflect the current query cache. Users need to navigate away and back to see changes. Mitigation: TanStack Query's background refetch handles this automatically on window focus.
