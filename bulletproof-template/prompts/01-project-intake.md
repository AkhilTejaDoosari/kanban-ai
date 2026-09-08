# Project Intake

Paste this whole file to start a new project.

---

You are entering PROJECT INTAKE MODE.

Do not write application code, modify project files, or begin implementation until the confirmation gates below are passed.

## Step 0 — Capability check

Check which capabilities from `CLAUDE.md` are available in this session.

Report only:

```text
AVAILABLE: <names>
MISSING:   <names>
```

If something is missing, state which workflow will be done manually instead.

Then say exactly:

`Ready. Send the project context.`

Stop and wait.

## Step 1 — Receive messy context

I will talk informally, repeat myself, change my mind, mix requirements with examples, and may be technically imprecise. That is expected.

Do not interrupt. Do not summarize as I go. Do not plan yet.

I will finish with:

`END CONTEXT`

## Step 2 — Classify before interpreting

After `END CONTEXT`, classify statements before using recency:

- **REQUIREMENT** — needed / client-mandated / non-negotiable
- **DECISION** — explicitly settled
- **PREFERENCE** — leaning, not binding
- **IDEA / EXAMPLE** — illustrative or hedged
- **SUPERSEDED** — clearly replaced by a later statement
- **OUT OF SCOPE** — explicitly excluded

A hedged product mention is an idea, not a decision. Example: “Google login required, maybe Clerk” = one requirement + one idea.

## Step 3 — Understanding report

Output only these five sections, concise enough that a human will actually read them:

```text
REQUIREMENTS
  <numbered>

NOT YET DECIDED
  <unsettled ideas/preferences/technical choices>

CONTRADICTIONS
  <real conflicts only>

ASSUMPTIONS
  <anything you inferred that I did not say>

OUT OF SCOPE
  <explicit exclusions>
```

Then say exactly:

`Awaiting CONTEXT CONFIRMATION.`

Stop.

If corrected, re-output only changed sections.

## Step 4 — On CONFIRM CONTEXT

Only after I reply `CONFIRM CONTEXT`:

1. Inspect the repository if code already exists.
2. Recommend a rigor profile: LEAN, STANDARD, or STRICT. Explain why in 2–4 bullets.
3. Treat monthly budget as `$0` unless I explicitly stated another budget.
4. Use brainstorming for unresolved product/architecture choices.
5. Use current documentation before committing to libraries, versions, hosted APIs, or service integrations.
6. Prefer the simplest architecture that satisfies the confirmed requirements.
7. Do not create separate frontend/backend apps unless there is an actual deployment, scaling, security, or language reason.
8. If there is UI, consult `docs/PALETTES.md` and use the strongest available frontend-design capability.

## Step 5 — Architecture + cost gate

Before populating project files, show me this proposal:

### A. Recommended architecture
- deployables/services
- data store
- auth
- external APIs
- major libraries only
- short plain-English repo shape

### B. Rigor profile
- recommended LEAN | STANDARD | STRICT
- why it fits this project
- what ceremony/checks this profile adds or omits

### C. Cost table

Include **every external hosted/paid/usage-metered service**:

| Service | Why needed | Free tier / limit | Estimated monthly cost | Variable-cost risk | Free/self-hosted alternative |
|---|---|---|---:|---|---|

Then show:

- **Confirmed monthly budget:** $X
- **Estimated monthly total:** $Y
- **Within budget:** YES / NO / UNCERTAIN
- **Services requiring explicit paid approval:** <list or none>

Do not hide costs because a service has a free tier. Mention the limit that could cause billing or force an upgrade.

If a paid or usage-metered service exceeds the confirmed budget, do not lock it in. Offer a free alternative first.

### D. Repository shape

Show the proposed top-level tree and explain in plain English what each major folder is for.

Keep framework-required config at root. Avoid cosmetic folder splitting.

### E. Open decisions

Only unresolved decisions that materially change architecture, cost, security, or scope.

Then say:

`Awaiting ARCHITECTURE APPROVAL.`

Stop.

## Step 6 — On APPROVE ARCHITECTURE

Only after I reply `APPROVE ARCHITECTURE`, populate/configure:

- `AGENTS.md` project profile, rigor profile, budget, stack, Status=CONFIGURED
- `PLAN.md` phases, dependencies, execution modes, capabilities, binary success criteria
- `PROGRESS.md` initial snapshot + intake/architecture approval entry
- `docs/ARCHITECTURE.md` including the approved cost/service table
- `docs/DESIGN.md` if UI exists
- `docs/DECISIONS.md` for consequential decisions only
- `README.md` human setup/usage + plain-English repository map
- `scripts/validate.sh` with real commands for applicable checks only
- `.github/workflows/ci.yml` for the detected stack, calling `bash scripts/validate.sh` rather than duplicating validation commands
- `.gitignore` for generated/local/secret artifacts
- `.env.example` with placeholder/empty values only when environment variables are needed
- `.claude/settings.json` permission boundaries if Claude Code is used

### Environment permission rule

Real secret-bearing env files must remain protected, including `.env`, `.env.local`, environment-specific `.env` files, and `*.local` variants.

`.env.example` must remain writable and committable with placeholder/empty values only. Do not use a broad deny pattern that blocks `.env.example`.

### CI rule

CI may contain stack setup (for example setting up Node/Python/Go) but must invoke `bash scripts/validate.sh` as the validation authority.

Do not duplicate lint/typecheck/test/build commands directly in CI.

## Step 7 — Final intake report

Report only:

- selected rigor profile
- confirmed budget
- estimated monthly total
- phase names + execution modes
- files configured
- anything still intentionally unresolved

Then stop. Do not begin Phase 1 automatically.
