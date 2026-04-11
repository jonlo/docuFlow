## ADDED Requirements

### Requirement: Event reports page
The system SHALL provide an Event Reports view within the Reports page. The view MUST display two charts derived from calendar events: a bar chart of event count bucketed by the selected time range, and a donut chart of events grouped by label. All charts MUST react to the active label filter and time range selector.

#### Scenario: Event reports renders with data
- **WHEN** calendar events exist and the user navigates to Reports → Events tab
- **THEN** both charts are rendered with data derived from the current events cache

#### Scenario: No events match the filter
- **WHEN** no events match the selected labels or fall within the selected time range
- **THEN** each chart shows an empty state message instead of a chart

#### Scenario: Label filter applied
- **WHEN** the user selects one or more labels in the filter
- **THEN** only events that have at least one of the selected labels are included in all charts

### Requirement: Event count over time chart
The Event Reports view SHALL include a bar chart showing the number of events per time bucket for the selected time range (daily = last 30 days, weekly = last 12 weeks, monthly = last 12 months, yearly = last 5 years). The X-axis labels MUST reflect the bucket granularity (e.g. "Mon Apr 7", "W14", "Apr 2026", "2025"). Buckets with zero events MUST still be shown.

#### Scenario: Events bucketed by time range
- **WHEN** the user selects "Monthly" and events exist
- **THEN** the bar chart shows one bar per month for the last 12 months, each bar representing the event count in that month

#### Scenario: Switching time range updates chart
- **WHEN** the user switches from "Weekly" to "Daily"
- **THEN** the chart re-buckets and re-renders with daily granularity

### Requirement: Events by label chart
The Event Reports view SHALL include a donut chart showing the distribution of events across labels. Each segment represents one label, colored with the label's own color. Events with no label MUST appear as an "Unlabelled" segment. A legend MUST show label name and event count.

#### Scenario: Events with labels shown
- **WHEN** events have labels assigned
- **THEN** the donut chart shows one segment per label with the event count for that label

#### Scenario: Unlabelled events segment
- **WHEN** some events have no labels
- **THEN** an "Unlabelled" segment is shown in a neutral color with the count of label-less events
