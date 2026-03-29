## ADDED Requirements

### Requirement: Light lavender-gray design token system
The system SHALL define a complete light-mode color token set in `tailwind.config.ts` replacing the existing dark palette. Tokens MUST cover surface hierarchy, accent colors, text hierarchy, border, and event block colors.

#### Scenario: Page background and surface hierarchy
- **WHEN** the app renders
- **THEN** the page background is `#EEEEF8` (lavender-gray), cards and sidebar are `#FFFFFF` (white), and overlay surfaces are `#F5F5FC`

#### Scenario: Accent color usage
- **WHEN** an interactive element is in its active or selected state
- **THEN** it uses `#6B5ECD` (purple) for fills, borders, or indicators

#### Scenario: Text hierarchy on light background
- **WHEN** text is rendered anywhere in the app
- **THEN** primary text is `#1A1A2E`, secondary/muted text is `#6B6B8A`, and placeholder/disabled text is `#A0A0BE`

#### Scenario: Border and divider rendering
- **WHEN** a border or divider is visible
- **THEN** it renders at `#E2E2EE` — subtle enough not to create visual noise

### Requirement: Event block color families
The system SHALL define four pastel event color families (lavender, sky, mint, peach) as Tailwind tokens, each with a background value and a left-border accent value.

#### Scenario: Default event color (no colorId)
- **WHEN** a calendar event has no `colorId`
- **THEN** it renders with the lavender family: background `#E8E4FF`, left border `#C4BAFF`

#### Scenario: Color family applied by colorId
- **WHEN** a calendar event has a `colorId` of 1–11
- **THEN** it is mapped to one of the four families (lavender, sky, mint, peach) via a deterministic lookup

### Requirement: Consistent typography weights on light background
The system SHALL ensure DM Sans renders at appropriate weights for legibility on the light background: regular (400) for body, medium (500) for labels and event titles, semibold (600) for section headers.

#### Scenario: Event title legibility
- **WHEN** an event block is rendered
- **THEN** the event title uses font-weight 500 and is clearly legible against the pastel background
