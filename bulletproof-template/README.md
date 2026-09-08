# Bulletproof AI Project Template

A reusable, cross-agent project bootstrap that turns a messy human project idea into a cost-aware, documented, testable implementation plan without over-engineering simple apps.

## Core idea

The template separates:

- `AGENTS.md` — portable engineering policy
- `CLAUDE.md` — Claude-specific capability adapter
- `PLAN.md` — what will be built and in what order
- `PROGRESS.md` — what actually happened over time
- `docs/ARCHITECTURE.md` — how the system works, including cost model
- `docs/DESIGN.md` — project-specific visual contract
- `docs/DECISIONS.md` — durable decisions and rationale
- `prompts/` — workflow entry points
- `scripts/validate.sh` — one deterministic validation entrypoint
- `.github/workflows/ci.yml` — CI scaffold, configured during intake

## What changed in v1.4.0

This version incorporates lessons from building a real Kanban + AI app:

1. **Budget awareness** — monthly budget defaults to `$0`; architecture must show paid/usage-metered services, estimated monthly total, free alternatives, and variable-cost risks before approval.
2. **Progress tracking** — `PROGRESS.md` records chronological execution history so long projects can resume cleanly after days or weeks.
3. **Environment safety without blocking `.env.example`** — real secret-bearing env files remain denied; `.env.example` is allowed with placeholders only.
4. **CI baseline** — GitHub Actions is part of project intake and must call the same `scripts/validate.sh` used locally.
5. **Repository structure discipline** — root clutter is limited, framework-required configs stay where tools expect them, and `frontend/`/`backend/` are not created unless the architecture genuinely needs separate apps.
6. **Adaptive rigor** — LEAN, STANDARD, and STRICT profiles prevent a small app from getting enterprise ceremony by default.
7. **Architecture approval gate** — the model cannot silently lock in expensive services or unnecessary complexity after context confirmation.

## Workflow

```text
clone template
  ↓
start coding agent
  ↓
paste prompts/01-project-intake.md
  ↓
agent: Ready. Send the project context.
  ↓
you brain-dump naturally
  ↓
END CONTEXT
  ↓
short understanding report
  ↓
CONFIRM CONTEXT
  ↓
architecture + cost + rigor + repo-shape proposal
  ↓
APPROVE ARCHITECTURE
  ↓
canonical files are populated
  ↓
execute each PLAN phase using:
  - prompts/02-execute-phase.md for GATED work
  - prompts/05-autonomous-phase.md for AUTONOMOUS/Ralph work
  ↓
prompts/03-review.md
  ↓
prompts/04-final-verification.md
```

## Execution modes

### GATED
Use when a wrong decision should stop before the next phase: auth, DB schema, infrastructure, payments, destructive migrations, unfamiliar architecture.

### AUTONOMOUS
Use when the decision is already made and the phase has deterministic success criteria: UI implementation, repetitive CRUD, refactoring, test expansion, well-scoped feature work.

Autonomy is execution authority, not product authority.

## Rigor profiles

### LEAN
Prototype/simple app. Minimal ceremony, critical-path tests, basic validation.

### STANDARD
Default serious app. CI, meaningful tests, security review on sensitive surfaces, E2E where useful.

### STRICT
Production/client/high-risk. Stronger gates, security/threat review, critical E2E, rollback/recovery thinking.

Intake recommends a profile; the human confirms it before architecture is locked.

## Repository map after intake

The exact tree depends on the stack. Do not force a fake frontend/backend split.

Typical full-stack web app:

```text
.
├── .claude/
├── .github/workflows/
├── docs/
├── e2e/                 # if configured
├── prompts/
├── scripts/
├── src/                 # product code
├── <database-assets>/   # e.g. supabase/, prisma/, db/
├── AGENTS.md
├── CLAUDE.md
├── PLAN.md
├── PROGRESS.md
├── README.md
└── framework-required root config
```

## Rule of thumb

The template should make a project safer and easier to resume, not slower merely for the sake of ceremony. If the process feels like a million-dollar kitchen for an omelet, the rigor profile or architecture is wrong.
