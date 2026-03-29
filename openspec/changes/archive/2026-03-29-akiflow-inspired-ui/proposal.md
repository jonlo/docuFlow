## Why

The app currently uses a dark theme that doesn't match the calm, focused aesthetic users expect from a productivity tool. The Akiflow-inspired design — a light lavender-gray background, pastel event blocks, clean typography, and subtle depth — better conveys clarity and reduces visual fatigue during long working sessions.

## What Changes

- Replace dark theme with light lavender-gray background (`#EEEEF8`) and white card surfaces
- Replace current color tokens in Tailwind config with a light-mode palette (surface, accent, text, border)
- Update `globals.css` layout shell, scrollbar, and base styles for the light theme
- Style the sidebar: white background, icon-based nav, subtle left-border active indicator
- Style the calendar header: month + week label, navigation arrows, view switcher
- Style calendar day columns and time gutter to match Akiflow's clean grid
- Style event blocks: pastel fill colors (lavender, sky blue, mint green), rounded corners, small icon slots, time sub-label
- Style the task panel: white surface, clean list items with checkbox circles
- Add a "today" column highlight (slightly warmer white) and current-time indicator line in purple
- Import Inter or keep DM Sans — ensure font renders at correct weights for the light background

## Capabilities

### New Capabilities

- `ui-theme`: Light lavender-gray design system — color tokens, typography scale, surface hierarchy, and spacing conventions for the entire app

### Modified Capabilities

- `calendar-view`: Event block visual style changes (pastel fills, rounded corners, icon slots, time sub-label). No behavior changes — display-only.

## Impact

- **packages/web/src/styles/globals.css** — full rewrite of base styles and layout shell
- **packages/web/tailwind.config.ts** — full replacement of color tokens
- **packages/web/src/google/CalendarView.tsx** — event block rendering and CSS class updates
- **packages/web/src/components/layout/Sidebar.tsx** — style updates
- **No API changes, no new dependencies** (react-big-calendar custom CSS only)
