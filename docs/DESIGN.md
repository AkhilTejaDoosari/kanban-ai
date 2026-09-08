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
| text muted | `#848A9D` | labels, timestamps, secondary text (ADR-007: lightened from `#6E7383`, which failed 4.5:1 against `surface`) |
| accent | `#8B7FFF` | active states, focus rings, primary actions, AI panel accent (ADR-008: brightened from `#7C9CFF` for a livelier feel) |
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
| text muted | `#636776` | labels, timestamps, secondary text (ADR-007: darkened from `#6E7383`, which failed 4.5:1 against `background`) |
| accent | `#685FBF` | darkened from the dark-theme accent to hold contrast on white (ADR-008: rebased on the brighter `#8B7FFF`; still >=4.97:1 against both surfaces) |
| border | `#E4E7ED` | |
| success | `#107A37` | ADR-007: darkened from `#16A34A`, which failed 4.5:1 against both surfaces |
| warning | `#B45309` | |
| danger | `#DC2626` | |

Exact values were a starting point for Phase 4 (`frontend-design`); adjusted per
ADR-007 after computing WCAG contrast ratios revealed failures. All roles above
now meet 4.5:1 against both `background` and `surface` in their theme, except
where a role is documented as large-text/UI-only.

### Label palette (ADR-008)

New labels cycle through this fixed palette (`src/lib/board-constants.ts`
`LABEL_COLORS`) rather than reusing one color for every label — the source of
a populated board's color, not the app chrome. Each swatch is verified
>=4.5:1 against `#12141A` text, so chips use that one dark text color in
both themes rather than a per-swatch light/dark choice.

| Name | Value |
|---|---|
| indigo | `#8B7FFF` |
| coral | `#FF9466` |
| teal | `#2DD4BF` |
| pink | `#F472B6` |
| amber | `#FBBF24` |
| green | `#4ADE80` |
| sky | `#38BDF8` |
| violet | `#C084FC` |

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
