## ADDED Requirements

### Requirement: Task reports page
The system SHALL provide a Task Reports view within the Reports page. The view MUST display three charts derived from the tasks data: a bar chart of time spent per task (using `totalSeconds`), a donut chart of task status distribution, and a line chart of task completion trend over the selected time range. All charts MUST react to the active label filter and time range selector.

#### Scenario: Task reports renders with data
- **WHEN** tasks exist and the user navigates to Reports → Tasks tab
- **THEN** all three charts are rendered with data derived from the current task cache

#### Scenario: No tasks match the filter
- **WHEN** no tasks match the selected labels or time range
- **THEN** each chart shows an empty state message instead of a chart

#### Scenario: Label filter applied
- **WHEN** the user selects one or more labels in the filter
- **THEN** only tasks that have at least one of the selected labels are included in all charts

### Requirement: Time spent per task chart
The Task Reports view SHALL include a horizontal bar chart showing the total time tracked (`totalSeconds`) for each task. Tasks with zero tracked time SHALL be excluded. The bars MUST be colored by task status using the same status color palette used elsewhere in the app. The time axis MUST show human-readable duration (e.g. "1h 30m").

#### Scenario: Tasks with tracked time shown
- **WHEN** one or more tasks have `totalSeconds > 0`
- **THEN** a bar is rendered for each such task, sized proportionally to its tracked time

#### Scenario: Tasks without tracked time excluded
- **WHEN** a task has `totalSeconds === 0`
- **THEN** it does not appear in the time-spent chart

### Requirement: Task status distribution chart
The Task Reports view SHALL include a donut chart showing the count of tasks in each status (pending/waiting, in_progress, done/completed, blocked). Each segment MUST use the same status color as used in the calendar and sidebar. A legend MUST show status label and count.

#### Scenario: All statuses present
- **WHEN** tasks exist across multiple statuses
- **THEN** the donut chart shows one segment per status with the correct count

#### Scenario: Single status
- **WHEN** all tasks share one status
- **THEN** the donut chart shows a single full-circle segment

### Requirement: Task completion trend chart
The Task Reports view SHALL include a line chart showing how many tasks were completed (`status === "done"`) within each time bucket of the selected time range (daily = last 30 days, weekly = last 12 weeks, monthly = last 12 months, yearly = last 5 years). Buckets with zero completions MUST still appear as zero-value points.

#### Scenario: Completions plotted over time
- **WHEN** completed tasks exist within the selected time range
- **THEN** the line chart shows data points for each bucket, with the count of tasks completed in that period

#### Scenario: No completions in range
- **WHEN** no tasks were completed in the selected range
- **THEN** the chart renders with all zero values and an empty-state annotation
