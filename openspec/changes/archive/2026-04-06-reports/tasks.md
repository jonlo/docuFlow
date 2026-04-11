## 1. Dependencies & Store

- [x] 1.1 Install `recharts` in `packages/web`: `pnpm --filter @flowdocs/web add recharts`
- [x] 1.2 Add `"reports"` to the `activePage` union type in `packages/web/src/stores/appStore.ts`

## 2. Sidebar Navigation

- [x] 2.1 Add a "Reports" nav button to `Sidebar.tsx` between "Tasks" and the Config section, calling `setActivePage("reports")`

## 3. App Routing

- [x] 3.1 Import `ReportsPage` in `App.tsx` and render it when `activePage === "reports"`

## 4. ReportsPage Shell

- [x] 4.1 Create `packages/web/src/reports/ReportsPage.tsx` with page header, tab bar (Tasks / Events), shared time range selector (Daily / Weekly / Monthly / Yearly), and shared label multi-select filter
- [x] 4.2 Wire tab state (`"tasks" | "events"`), time range state, and selected labels state with `useState`; pass as props to sub-views

## 5. Shared Utilities

- [x] 5.1 Create `packages/web/src/reports/reportUtils.ts` with bucket helpers: `bucketByDay`, `bucketByWeek`, `bucketByMonth`, `bucketByYear` using `date-fns`
- [x] 5.2 Add `formatDuration(seconds: number): string` helper (e.g. "1h 30m") in the same file

## 6. Task Reports View

- [x] 6.1 Create `packages/web/src/reports/TaskReportsView.tsx` — receives filtered tasks, time range, renders three chart sections
- [x] 6.2 Implement time-spent bar chart (`BarChart`) — horizontal bars per task, colored by status, showing formatted duration; exclude tasks with 0 seconds
- [x] 6.3 Implement status distribution donut chart (`PieChart` with `innerRadius`) — one segment per status, using `TASK_STATUS_COLORS` from `CalendarView`; include legend with label + count
- [x] 6.4 Implement task completion trend line chart (`LineChart`) — bucket completed tasks by selected time range, X-axis labels formatted by granularity, zero-value buckets shown

## 7. Event Reports View

- [x] 7.1 Create `packages/web/src/reports/EventReportsView.tsx` — receives filtered events, time range, renders two chart sections
- [x] 7.2 Implement event count over time bar chart (`BarChart`) — one bar per time bucket, X-axis label by granularity, zero-value buckets shown
- [x] 7.3 Implement events-by-label donut chart (`PieChart` with `innerRadius`) — one segment per label using label's own color, "Unlabelled" segment for events with no labels; include legend

## 8. Label Filter Component

- [x] 8.1 Create `packages/web/src/reports/LabelFilter.tsx` — multi-select dropdown populated from `useLabels()`; shows color dot + label name per option; "All labels" placeholder when none selected
- [x] 8.2 Wire label filter selection to filter tasks/events in `ReportsPage` before passing to sub-views

## 9. Empty States

- [x] 9.1 Add an `EmptyChart` component (or inline element) rendered inside each chart section when the filtered data is empty — shows a short message like "No data for this range"

## 10. Validation

- [x] 10.1 Verify "Reports" nav item appears in sidebar and navigates to the reports page
- [x] 10.2 Verify Tasks tab shows all three charts with real task data
- [x] 10.3 Verify Events tab shows both charts with real event data
- [x] 10.4 Verify switching time range updates all charts in the active view
- [x] 10.5 Verify label filter hides tasks/events without the selected labels across all charts
- [x] 10.6 Verify empty state is shown when no data matches the current filter/range
- [x] 10.7 Run TypeScript check: `pnpm --filter @flowdocs/web exec tsc --noEmit`
