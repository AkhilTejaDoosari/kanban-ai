# Project Intake

Paste this whole file to start a new project.

---

You are entering PROJECT INTAKE MODE. Do not write application code, do not modify
any file, and do not begin planning until explicitly released by the confirmation
step below.

## Step 0 — Capability check

Before anything else, check which capabilities from `CLAUDE.md` are actually
available in this session. Report as:

```
AVAILABLE:   <names>
MISSING:     <names>
```

If any are missing, state which parts of the workflow will be done manually instead.
Do not silently proceed as if they exist. Then continue to Step 1.

## Step 1 — Receive context

Say exactly: `Ready. Send the project context.`

Then stop and wait. I will talk informally, out of order, and I will contradict
myself. That is expected. Do not interrupt with questions. Do not summarize as I go.
I will end with `END CONTEXT`.

## Step 2 — Classify

When you receive `END CONTEXT`, classify every statement I made. Do not treat
recency alone as authority — classify first, then apply recency only within a
category when something genuinely changed.

- **REQUIREMENT** — stated as needed, non-negotiable, or client-mandated
- **DECISION** — settled choice, stated with commitment
- **PREFERENCE** — a leaning, not binding
- **IDEA / EXAMPLE** — floated, illustrative, hedged ("maybe", "we could", "like")
- **SUPERSEDED** — later statement clearly replaced an earlier one
- **OUT OF SCOPE** — explicitly excluded

A hedged mention of a specific product is an IDEA, never a DECISION. "Google login
required, maybe use Clerk" is one requirement and one idea, not two decisions.

## Step 3 — Understanding report

Output exactly these five sections. Nothing else. Keep it short enough that a human
will actually read it — if it runs long, you are including detail that belongs in
`PLAN.md` later.

```
REQUIREMENTS
  <what must be true — numbered>

NOT YET DECIDED
  <ideas, preferences, open choices — say plainly that these are unsettled>

CONTRADICTIONS
  <where I said conflicting things, and which reading you took>

ASSUMPTIONS
  <what you filled in that I never said>

OUT OF SCOPE
  <what is explicitly excluded>
```

Then say: `Awaiting CONTEXT CONFIRMATION.` and stop.

If I correct you, apply the correction and re-output only the sections that changed.

## Step 4 — On CONFIRM CONTEXT

Only after I reply `CONFIRM CONTEXT`:

1. Inspect any existing code in the repo before proposing structure.
2. Use brainstorming for anything still open in NOT YET DECIDED, and bring me
   options with trade-offs rather than picking silently.
3. Use current documentation lookup before committing to any library or version.
4. Consult `docs/PALETTES.md` for a starting visual direction if there is a UI.

## Step 5 — Populate

Fill in, in this order:

- `AGENTS.md` §1 project profile — set Status to CONFIGURED
- `scripts/validate.sh` — this project's real lint/typecheck/test/build commands.
  Leave a variable empty if that check does not apply here; do not invent one to
  fill the slot. These commands go in the script only — never restate them in
  `AGENTS.md` or `README.md`.
- `PLAN.md` — phases with success criteria that are observable, binary, specific
- `docs/ARCHITECTURE.md` — how the system works
- `docs/DESIGN.md` — the chosen visual contract, if there is a UI
- `docs/DECISIONS.md` — one ADR per significant choice made during intake
- `README.md` — how a human runs this project

Do not add engineering rules to `AGENTS.md` §3–8. Do not add project detail to
`CLAUDE.md`. Leave `docs/PALETTES.md` unchanged — it is a reference library.

Finally, report which files you changed and what remains unconfigured.
