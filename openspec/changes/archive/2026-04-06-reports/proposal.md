## Why

Users have no visibility into how their time is being spent or how their calendar and tasks are distributed over time. A dedicated Reports section gives users actionable insights — time tracked per task, event volume trends, task completion rates — broken down by label and time range.

## What Changes

- Add a "Reports" nav item to the sidebar (between Tasks and Labels)
- Add a `ReportsPage` component with two sub-views switchable via a tab bar:
  - **Task Reports**: charts showing time spent per task, task status breakdown (pie/donut), task completion trend over time
  - **Event Reports**: charts showing event count by day/week/month/year, events by label
- Both views support filtering by label (multi-select from existing labels)
- Both views support time range selection: Daily, Weekly, Monthly, Yearly
- Data is derived client-side from existing `useTasks` and `useCalendarEvents` query caches — no new API endpoints required

## Capabilities

### New Capabilities
- `reports-task`: Task reporting charts — time spent per task, status distribution, completion trend, filterable by label and time range
- `reports-events`: Event reporting charts — event count over time (daily/weekly/monthly/yearly), events by label, filterable by label

### Modified Capabilities
- `task-sidebar-list`: Add "Reports" nav item to the sidebar navigation list

## Impact

- New files: `packages/web/src/reports/ReportsPage.tsx`, chart sub-components
- Modified: `packages/web/src/components/layout/Sidebar.tsx` (new nav item), `packages/web/src/stores/appStore.ts` (`activePage` union extended), `packages/web/src/App.tsx` (render reports page)
- New dependency: a charting library (Recharts — already widely used with React, zero-config with Tailwind)
- No backend changes required
