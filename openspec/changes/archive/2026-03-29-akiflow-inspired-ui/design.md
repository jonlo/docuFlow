## Context

The app currently has a dark theme (`#0f0f10` background, zinc color family) defined in `tailwind.config.ts` and `globals.css`. The reference design (Akiflow) uses a light lavender-gray background with white card surfaces, pastel event fills, and Inter/system sans-serif at clean weights. The change is CSS/styling only — no API, no state management, no new npm packages.

The existing structure is well-suited: Tailwind tokens live in one file, layout in `globals.css`, and component-level styles via Tailwind classes. react-big-calendar ships its own CSS (`react-big-calendar/lib/css/react-big-calendar.css`) which needs targeted overrides.

## Goals / Non-Goals

**Goals:**
- Replace dark theme with Akiflow-inspired light lavender-gray design system
- Define a coherent token set (surface, text, border, accent, event colors) in Tailwind config
- Style layout shell, sidebar, calendar grid, event blocks, and task panel
- Override react-big-calendar default styles to match the target aesthetic
- Keep all styles within existing files — no new CSS files unless necessary for rbc overrides

**Non-Goals:**
- Dark mode toggle (light only for now)
- Pixel-perfect Akiflow clone — spirit and feel, not exact reproduction
- Animations or transitions beyond what already exists
- Changing any component logic, data fetching, or API contracts

## Decisions

### 1. Tailwind token strategy: replace, don't extend

Replace the existing `surface` and `accent` color families entirely with the light-mode palette. Keep the same token names (`surface.base`, `surface.raised`, `accent.primary`) so component class names need minimal updating.

**New palette:**
```
surface.base:    #EEEEF8   (lavender-gray page background)
surface.raised:  #FFFFFF   (white cards — sidebar, calendar)
surface.overlay: #F5F5FC   (slightly lifted surfaces)
surface.border:  #E2E2EE   (subtle borders)

accent.primary:  #6B5ECD   (purple — today badge, time indicator, active states)
accent.secondary:#9B8EED   (lighter purple — hover states)
accent.muted:    #EAE8F8   (very light purple — today column bg)

text.base:       #1A1A2E   (near-black for primary text)
text.muted:      #6B6B8A   (gray-purple for secondary text, time labels)
text.subtle:     #A0A0BE   (lightest text — placeholder, disabled)

event.lavender:  #E8E4FF / #C4BAFF  (bg / left-border — calendar events)
event.sky:       #DFF0FF / #93C5FD  (bg / left-border — tasks)
event.mint:      #DFFAF0 / #6EE7B7  (bg / left-border — linked docs)
event.peach:     #FFF0E8 / #FDBA74  (bg / left-border — other)
```

**Why replace over extend**: Keeps token names stable, avoids parallel dark/light sets, and makes future dark-mode toggle (as a separate change) a clean switch of the config.

### 2. react-big-calendar overrides: CSS file, not Tailwind

rbc applies its own class names (`.rbc-event`, `.rbc-time-slot`, `.rbc-header`, etc.) that Tailwind can't easily target without `@layer` tricks. A dedicated `src/styles/calendar.css` imported in `CalendarView.tsx` is cleaner and easier to review.

**Why not inline styles or Tailwind arbitrary values**: rbc class names are applied by the library — not by our JSX — so we can't attach Tailwind classes to them without wrapping every sub-component.

### 3. Event block color assignment: `colorId` → CSS class map

Google Calendar events have an optional `colorId` (1–11). Map these to the four event color families (lavender, sky, mint, peach) via a small lookup in `CalendarView.tsx`. Events with no `colorId` default to lavender.

**Why**: Keeps colors declarative and consistent rather than generating inline styles per event.

### 4. Font: keep DM Sans, adjust weights

DM Sans at 400/500/600 renders well on light backgrounds. No font change needed — just ensure the correct weight classes are used now that the background is light (previously the dark background hid thin weights).

## Risks / Trade-offs

- **rbc override specificity wars** → Use `.flowdocs-calendar .rbc-*` scoped selectors to avoid affecting any future embedded calendars. Wrap the `<Calendar>` in a div with class `flowdocs-calendar`.
- **Tailwind purge missing rbc classes** → rbc classes are in node_modules CSS, not in our source — Tailwind won't purge them. Not an issue since they're in a separate CSS file.
- **Light background exposes previously hidden contrast issues** → Review text colors on all surfaces after implementation; `text.muted` may need darkening on `surface.overlay`.

## Migration Plan

1. Update `tailwind.config.ts` tokens
2. Rewrite `globals.css` base + layout styles
3. Write `src/styles/calendar.css` rbc overrides
4. Update `CalendarView.tsx` to import calendar CSS and apply event color classes
5. Update `Sidebar.tsx` class names
6. Visual review in browser — adjust as needed
7. Rollback: git revert the three CSS/config files — no data or API impact
