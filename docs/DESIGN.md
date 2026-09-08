# Design

The visual contract **for this project**. One chosen direction, not a menu.
`docs/PALETTES.md` in this repo is an empty template with no populated families, so
this direction was chosen directly rather than selected from that library (see
`docs/DECISIONS.md`).

## Direction

**Deep Ink / Focused Dark**, dark-first with a light theme derived from it. Near-
black, low-chroma surfaces, one cool indigo accent used sparingly for the active/
focus state, high text contrast. Deliberately not: pastel gradients, heavy
drop-shadows, playful illustration, or the generic light-gray-and-blue "AI SaaS
dashboard" look.

## Palette

### Dark (primary)

| Role | Value | Notes |
|---|---|---|
| background | `#12141A` | app background |
| surface | `#1A1D26` | cards, panels, columns |
| text primary | `#F2F3F5` | |
| text muted | `#6E7383` | labels, timestamps, secondary text |
| accent | `#7C9CFF` | active states, focus rings, primary actions, AI panel accent |
| border | `#262A36` | column/card borders, dividers |
| success | `#4ADE80` | |
| warning | `#FBBF24` | |
| danger | `#F87171` | |

### Light (secondary)

| Role | Value | Notes |
|---|---|---|
| background | `#F7F8FA` | |
| surface | `#FFFFFF` | |
| text primary | `#12141A` | |
| text muted | `#6E7383` | |
| accent | `#4C6FFF` | darkened from the dark-theme accent to hold contrast on white |
| border | `#E4E7ED` | |
| success | `#16A34A` | |
| warning | `#B45309` | |
| danger | `#DC2626` | |

Exact values are a starting point for Phase 4 (`frontend-design`); adjust freely if
implementation reveals a contrast or legibility issue, and record the change here.

## Typography

| Role | Family | Weight | Size |
|---|---|---|---|
| Page/section headings | System sans (e.g. Inter or the platform default) | 600 | 18–24px |
| Body / card content | Same family | 400–500 | 14px |
| Labels, meta (column headers, timestamps) | Same family | 500 | 11–12px, uppercase, letter-spaced |

A single sans family throughout — no serif/display pairing. Final family choice is
Phase 4's call if the system default doesn't read as premium enough.

## Spacing and radius

8px base spacing scale. Cards and panels use an 8px corner radius (soft, not sharp,
but not pill-shaped) — columns use a slightly larger radius (10–12px) to read as
containers. Comfortable density: enough padding that a column of cards doesn't feel
cramped, but no wasted whitespace that pushes columns off-screen on a laptop width.

## Component conventions

- **Buttons:** solid accent for primary actions, low-emphasis (bordered or ghost)
  for secondary/destructive-adjacent actions; destructive actions use the danger
  color and require the standard confirm step.
- **Cards (Kanban):** surface color, thin border, priority indicated by a small
  left-edge accent bar (not a loud badge), labels as small colored chips, due date
  as muted text, drag handle implicit (whole card draggable).
- **AI panel:** same surface/border language as the rest of the app — it must read
  as part of the product, not a bolted-on widget. Proposed actions render as a
  distinct preview block (bordered, accent-tinted) with explicit Confirm/Reject
  buttons — never auto-styled the same as a plain chat message.
- **Empty states:** short, direct copy + one primary action (e.g. "No projects yet
  — Create your first project"), no illustration required.
- **Loading states:** skeleton blocks matching the shape of what's loading (board
  columns, card list), not a generic spinner for anything longer than a click.
- **Error states:** inline, plain-language, no technical detail (`AGENTS.md` §7).

## Non-negotiables

- WCAG AA contrast floor: 4.5:1 for body text, 3:1 for large text, in both themes.
- Visible focus states on every interactive element (keyboard nav must work,
  including drag-and-drop reordering via `@dnd-kit`'s keyboard sensor).
- Minimum comfortable target size for clickable elements (buttons, card drag
  handles) — no sub-24px hit targets.
- Motion is functional only (drag feedback, panel open/close) — no decorative
  animation.
