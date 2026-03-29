## 1. Design Tokens

- [x] 1.1 Replace color tokens in `packages/web/tailwind.config.ts`: surface family (`base`, `raised`, `overlay`, `border`), accent family (`primary`, `secondary`, `muted`), text family (`base`, `muted`, `subtle`), and event color families (`lavender`, `sky`, `mint`, `peach` — each with `bg` and `border` values)

## 2. Base Styles

- [x] 2.1 Rewrite `packages/web/src/styles/globals.css`: set `body` background to `surface.base` (`#EEEEF8`), text to `text.base` (`#1A1A2E`), update scrollbar colors to match light theme
- [x] 2.2 Update layout shell classes in `globals.css`: sidebar border color to `surface.border`, task panel background to `surface.raised`, task panel border to `surface.border`

## 3. Sidebar

- [x] 3.1 Update `packages/web/src/components/layout/Sidebar.tsx`: set background to `surface.raised` (white), border-right to `surface.border`, icon and label colors to `text.muted`, active item indicator using `accent.primary` left border

## 4. Calendar CSS Overrides

- [x] 4.1 Create `packages/web/src/styles/calendar.css` with `.flowdocs-calendar` scoped rbc overrides:
  - Grid background: white columns, `surface.border` grid lines
  - Time gutter labels: `text.muted` color, clean right-align
  - Header row (day names + dates): white background, `text.muted` color, `surface.border` bottom border
  - Today column: `accent.muted` (`#EAE8F8`) background tint
  - Current time indicator line: `accent.primary` (`#6B5ECD`) color
  - Remove all default rbc blue colors and box-shadows
- [x] 4.2 Override `.rbc-event` base styles: remove default blue background, remove border-radius override (we'll set it per event class), set padding to `4px 6px`

## 5. CalendarView Component

- [x] 5.1 Wrap `<Calendar>` in `<div className="flowdocs-calendar h-full">` in `packages/web/src/google/CalendarView.tsx`
- [x] 5.2 Import `@/styles/calendar.css` in `CalendarView.tsx`
- [x] 5.3 Add `colorIdToFamily` lookup function: maps `colorId` strings `"1"`–`"11"` to `lavender | sky | mint | peach` (cycle through families for unmapped ids), default `lavender` for null/undefined
- [x] 5.4 Add `eventStyleGetter` function passed to `<Calendar eventPropGetter={...}>`: returns inline style with `backgroundColor`, `borderLeft: '3px solid <border-color>'`, `borderRadius: '6px'`, `color: text.base` based on the family
- [x] 5.5 Add `components.event` custom renderer to show event title (weight 500) and time sub-label below it (small, `text.muted`)

## 6. Auth Screen

- [x] 6.1 Update `packages/web/src/google/AuthGate.tsx` connect screen: set page background to `surface.base`, card to `surface.raised` with subtle shadow, button to `accent.primary` fill with white text, body text to `text.muted`

## 7. Visual Review

- [x] 7.1 Run dev server and do a visual pass — pending user review: verify background, sidebar, calendar grid, event blocks, today column highlight, and current-time indicator all match the Akiflow-inspired target
- [x] 7.2 Check text legibility on all surfaces — adjust `text.muted` or `text.subtle` values if contrast is insufficient
