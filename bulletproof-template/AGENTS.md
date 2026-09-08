# Agent Operating Policy

Portable policy for this repository. Tool-specific mappings live in adapter files such as `CLAUDE.md`.

This file is a **map, not a manual**. Route work to the right capability, keep project truth current, and prefer the simplest architecture that satisfies confirmed requirements.

## 1. Project profile

<!-- Populated during intake. Until then this project is UNCONFIGURED. -->

- Name:
- Purpose:
- Users:
- Stack:
- Status: UNCONFIGURED
- Rigor profile: LEAN | STANDARD | STRICT
- Monthly budget: $0 unless the user explicitly overrides it

If Status is `UNCONFIGURED`, do not write application code. Run `prompts/01-project-intake.md` first.

## 2. Sources of truth

| Question | Authoritative file |
|---|---|
| What are we building, and in what order? | `PLAN.md` |
| What actually happened over time? | `PROGRESS.md` |
| How does the system work? | `docs/ARCHITECTURE.md` |
| What does the UI look like, and why? | `docs/DESIGN.md` |
| Why was a significant choice made? | `docs/DECISIONS.md` |
| How does a human run/use this repo? | `README.md` |
| Reusable visual reference | `docs/PALETTES.md` |

If two files disagree, correct the stale one in the same change.

## 3. Core engineering rules

- Make the smallest change that satisfies the requirement.
- Prefer a single deployable/full-stack app for small products unless separate frontend/backend services are justified by deployment, scaling, security, or language requirements.
- Do not add dependencies, services, abstractions, workers, queues, or configuration that no current requirement needs.
- Do not weaken, skip, or delete a test to make a build pass.
- Do not fabricate APIs. Look up current docs when versions or external APIs matter.
- Never commit secrets, tokens, credentials, or real user data.
- Outside intake/brainstorming, materially ambiguous requirements must return to the human instead of being silently interpreted.

## 4. Capability routing

| When | Use the capability for |
|---|---|
| Requirements are vague | structured brainstorming |
| Work needs sequencing | plan writing |
| A phase is being implemented | plan execution |
| User-facing UI is built/changed | frontend design |
| Behavior is wrong and cause is unknown | systematic root-cause debugging |
| New behavior is added | test-driven development |
| Library/API/version matters | current documentation lookup |
| Auth/input/secrets/data exposure are touched | security review |
| A phase is complete | code review, then verification |
| Code works but is convoluted | simplification |

If a capability is unavailable, say so and perform the equivalent workflow manually.

## 5. Document and progress maintenance

Documentation updates are part of the change, never a follow-up.

- Architecture changed → update `docs/ARCHITECTURE.md`
- Durable choice changed → update `docs/DECISIONS.md`
- Visual contract changed → update `docs/DESIGN.md`
- Roadmap/status changed → update `PLAN.md`
- Human setup/usage changed → update `README.md`
- Meaningful implementation work completed, blocked, or verified → append to `PROGRESS.md`

`PROGRESS.md` is chronological history, not a second roadmap. Do not duplicate PLAN details there.

## 6. Cost discipline

Default monthly budget is **$0** unless the user explicitly states otherwise.

Before architecture is approved:

- identify every external service, API, paid tier, usage-metered dependency, and service that may require a card
- estimate likely monthly cost at the expected scale
- identify free-tier limits that matter
- provide at least one realistic free/self-hosted alternative where one exists
- show an estimated total monthly cost
- flag any variable/unbounded cost

Do not lock a paid or usage-metered service into architecture when it exceeds the confirmed budget without explicit human approval.

## 7. Rigor profiles

Use the lightest profile that still protects the project.

### LEAN
For prototypes, demos, simple internal tools, or low-risk apps.
- minimal architecture ceremony
- critical-path tests only
- basic validation
- CI recommended once the repo is shared
- ADRs only for consequential choices

### STANDARD
Default for serious apps.
- phase plan + binary success criteria
- unit/integration tests where valuable
- CI required
- security review for sensitive surfaces
- E2E for core user flows when practical

### STRICT
For production/client/high-risk systems.
- gated architecture decisions
- stronger threat/security review
- deterministic CI gates
- E2E for critical flows
- rollback/recovery considerations
- ADRs for major platform choices

The agent recommends a profile during intake; the human confirms it at the architecture gate.

## 8. Repository structure discipline

Keep the root understandable.

Root may contain only:
- canonical project docs (`AGENTS.md`, `CLAUDE.md`, `PLAN.md`, `PROGRESS.md`, `README.md`, `CHANGELOG.md`, `TEMPLATE_VERSION`)
- package/lock files
- environment example files
- framework/tool config that is conventionally or technically required at root

Prefer:
- app code → `src/`
- E2E → `e2e/`
- database assets → stack-specific folder such as `supabase/`, `prisma/`, `db/`
- docs → `docs/`
- prompts → `prompts/`
- scripts → `scripts/`
- CI → `.github/workflows/`
- Claude project config → `.claude/`

Do not create `frontend/` and `backend/` merely for visual neatness. Use them only if they are genuinely separate applications/services.

During intake, README must include a short plain-English repository map so a new developer can understand the project at a glance.

## 9. Security baseline

- Real environment files stay local and git-ignored.
- `.env.example` is allowed and committed with empty/placeholder values only.
- Validate external input at trust boundaries.
- Authorization is checked server-side on protected operations.
- User-facing errors do not leak stack traces, queries, secrets, or internal paths.

## 10. Success criteria and definition of done

Every phase has observable, binary, specific success criteria.

A change is done only when:
- success criteria are met
- `bash scripts/validate.sh` exits zero for configured checks
- new behavior has appropriate tests for the chosen rigor profile
- affected docs are current
- `PROGRESS.md` is updated
- no secrets were added
- CI is green when CI is configured

## 11. Validation and CI

One local validation entrypoint:

```bash
bash scripts/validate.sh
```

Commands live in that script and nowhere else.

GitHub Actions must invoke the same validation script rather than duplicating lint/typecheck/test/build commands. Stack setup may differ, but validation logic must not drift.

## 12. Autonomous execution

Autonomy applies to execution only, never product authority.

A phase may loop autonomously only when:
- project Status is CONFIGURED
- phase mode is AUTONOMOUS
- dependencies are complete
- requirements were confirmed
- success criteria are binary/observable
- deterministic validation exists
- work is on a non-default branch

The loop may not change requirements, deliverables, dependencies, execution mode, or success criteria.

Stop and return to the human on:
- requirement contradiction
- destructive/irreversible action
- credentials, payments, account ownership, or real-data migration
- scope creep outside the phase
- same failing check three iterations in a row
- exhausted iteration budget

## 13. Phase execution

Before coding:
1. confirm project is CONFIGURED
2. restate phase goal, deliverables, dependencies, mode, and success criteria
3. name relevant capabilities
4. confirm success criteria are observable

While working:
- stay inside deliverables
- prefer smallest coherent change
- use current docs when APIs/versions matter
- test first where appropriate for the rigor profile

On completion:
- run `bash scripts/validate.sh`
- state evidence for each success criterion
- update canonical docs and `PROGRESS.md`
- update PLAN status
- stop before starting the next phase
