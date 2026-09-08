# Template Changelog

Projects record the template version they were cloned from in `TEMPLATE_VERSION`.
That file is **not** auto-updated. To pull template improvements into an existing
project, diff this changelog from your recorded version forward and apply changes
by hand.

## 1.3.0 — execution mode per phase

- `PLAN.md` phases declare `Execution mode: GATED | AUTONOMOUS`, decided during
  planning rather than at the moment a prompt is pasted
- `05-autonomous-phase.md` checks the field at preflight and refuses a GATED phase.
  §10 forbids an agent from promoting a phase to AUTONOMOUS — mode joins requirements
  and success criteria as fields the loop may not touch
- Both prompts open with an unmistakable MODE banner
- `README.md` explains choosing a mode and points at §10 for stop conditions rather
  than restating them, so there is one copy to maintain

## 1.2.0 — procedure moved out of prompts

`02-execute-phase.md` and `05-autonomous-phase.md` had grown ~70% identical text:
preflight, dependency checks, validation, doc updates, completion reporting. Two
copies of the same policy is the drift problem this template exists to prevent.

- `AGENTS.md` §11 now holds the phase execution procedure for both modes
- Both prompts shrank to a mode declaration and the deltas unique to that mode.
  `02` is 12 lines, `05` is 39
- Two entry points are kept deliberately. Handing over control should be a separate
  act, not a flag inside a shared prompt

## 1.1.0 — autonomous execution

Added because a looping executor (Ralph Loop, `subagent-driven-development`) needs
boundaries that hold without a human watching each step.

- `AGENTS.md` §10: preconditions, stop conditions, and scope for loop execution
- The loop may edit Status in `PLAN.md` and nothing else. An agent that can rewrite
  its own success criteria has no exit condition
- Repeated identical failure (three iterations) is a stop condition, not a retry
- `prompts/05-autonomous-phase.md`: preflight gate, iteration log, completion report
- `.claude/settings.json` returns — for permissions only, not hooks. A deny-list on
  destructive commands and secret files is mechanical where §10's prose is not, and
  what an agent may do unsupervised in this repo is project state
- Verify the permissions syntax against current Claude Code docs on first use

## 1.0.0 — initial freeze

Architecture

- `AGENTS.md` as portable policy; `CLAUDE.md` as a thin adapter over it
- Global capabilities are assumed installed on the machine, not vendored per repo.
  Availability is checked live at intake rather than tracked in the repo, because
  what is installed is machine state and this repo holds project state
- Document-maintenance rule: doc updates ship in the same commit as the change

Validation

- `scripts/validate.sh` is the single authoritative home for lint, typecheck, test,
  and build commands. Humans, agents, git hooks, and CI all invoke that one script,
  so the commands cannot drift between callers
- Unconfigured checks are skipped, not failed — a Terraform repo has no typecheck
  and a small CLI may have no build. Definition of done requires configured checks
  to pass, not the existence of all four
- No automatic enforcement hook ships in this version. The right lifecycle point is
  project-dependent, and full validation on every agent stop is too expensive to be
  the default. `README.md` documents an opt-in git pre-commit hook

Workflow

- Intake gated behind a capability check and an explicit `CONFIRM CONTEXT` step
- Statement classification (requirement / decision / idea / superseded), with the
  rule that recency alone does not confer authority
- Ambiguity handling is scoped: stop and ask during normal work, collect and surface
  at classification during intake
- Phases declare dependencies explicitly. Independent phases may run in parallel;
  phase N is not assumed to depend on phase N-1
