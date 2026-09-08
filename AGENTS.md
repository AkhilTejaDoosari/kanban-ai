# Agent Operating Policy

Portable engineering policy for this repository. Any coding agent reads this file.
Tool-specific mappings live in adapter files (`CLAUDE.md` and equivalents) — never here.

This file is a **map, not a manual**. It states what must be true and when a
capability is needed. It does not explain how to perform a capability.

---

## 1. Project profile

<!-- Populated during intake. Until then this project is UNCONFIGURED. -->

- Name: Kanban AI (working name)
- Purpose: A Kanban project management app where each user manages multiple isolated projects, each with its own To Do / In Progress / Done / Shipped board, plus a project-scoped AI assistant that can propose (and, on confirmation, execute) changes to that project's board.
- Users: Individual users juggling several concurrent projects who sign in with Google.
- Stack: Next.js (App Router, current stable version — verify via current documentation at implementation time), Supabase Postgres with Row Level Security, Clerk (auth, Google OAuth, native Supabase third-party auth integration), `@dnd-kit/react` for drag-and-drop, Anthropic API (`@anthropic-ai/sdk`) for the AI assistant's tool-use loop.
- Status: CONFIGURED

If Status is `UNCONFIGURED`, do not write application code. Run intake first
(`prompts/01-project-intake.md`).

---

## 2. Sources of truth

| Question | Authoritative file |
|---|---|
| What are we building, and in what order? | `PLAN.md` |
| How does the system work? | `docs/ARCHITECTURE.md` |
| What does the UI look like, and why? | `docs/DESIGN.md` |
| Why was a significant choice made? | `docs/DECISIONS.md` |
| What is a human supposed to do with this repo? | `README.md` |
| Reusable visual reference | `docs/PALETTES.md` |

Exactly one file answers each question. If two files disagree, the table wins and
the loser is corrected in the same commit.

---

## 3. Core engineering rules

- Make the smallest change that satisfies the requirement.
- Do not add dependencies, abstractions, or configuration that no current
  requirement needs.
- Do not weaken, skip, or delete a test to make a build pass.
- Do not fabricate API surfaces. If unsure of a library's current behavior, look it
  up before writing against it.
- Never commit secrets, credentials, tokens, or real user data.
- Outside an explicit intake or brainstorming workflow, if a requirement is
  materially ambiguous, stop and ask rather than silently choosing an
  interpretation. Inside intake, collect ambiguity and surface it at the
  classification step instead of interrupting.

---

## 4. Capability routing

State the need; the adapter resolves the tool.

| When | Use the capability for |
|---|---|
| Requirements are vague or the shape is unclear | structured brainstorming |
| Work needs sequencing into phases | plan writing |
| A phase is being implemented | plan execution |
| Any user-facing interface is built or changed | frontend design |
| Behavior is wrong and the cause is unknown | systematic root-cause debugging |
| New behavior is being added | test-driven development |
| A library, framework, or API version matters | current documentation lookup |
| Auth, input handling, secrets, or data exposure is touched | security review |
| A phase is complete | code review, then verification |
| Code works but is convoluted | simplification |

If a capability is unavailable, say so explicitly, then perform the equivalent
workflow manually. Never silently skip it.

---

## 5. Document maintenance

**A change that contradicts a source-of-truth document must update that document in
the same commit.** Documentation updates are part of the change, never a follow-up.

Specifically:

- Changed how the system works → update `docs/ARCHITECTURE.md`
- Made a choice a future reader would question → add an entry to `docs/DECISIONS.md`
- Changed the visual contract → update `docs/DESIGN.md`
- Completed or reordered work → update `PLAN.md` status
- Changed how a human runs or operates the project → update `README.md`

A stale document is worse than a missing one, because agents trust it. If you notice
a document that no longer matches the code, correcting it takes priority over new work.

---

## 6. Success criteria

Every phase in `PLAN.md` carries success criteria that are:

- observable — a human or a command can check them
- binary — met or not met, no partial credit
- specific — no "works well", "is robust", "is performant"

A phase is not complete because the code was written. It is complete when every
criterion is demonstrably met.

---

## 7. Security baseline

- Secrets come from the environment. `.env` is git-ignored; `.env.example` is committed
  with placeholder values only.
- Validate and type all external input at the boundary.
- Authorization is checked server-side on every protected operation, never in the UI alone.
- Dependencies are pinned.
- Errors surfaced to users do not leak stack traces, queries, or internal paths.

---

## 8. Definition of done

A change is done when all of the following hold:

- [ ] Success criteria for the phase are met
- [ ] `bash scripts/validate.sh` exits zero — every configured check passes
- [ ] New behavior is covered by a test, if this project has tests configured
- [ ] Affected source-of-truth documents are updated in this commit (see §5)
- [ ] No secrets added
- [ ] Changes explained to the human in plain language

A check that is not configured for this project is skipped, not failed. A check that
is configured and failing blocks done. Claiming done without running the script and
showing its output is a policy violation.

---

## 9. Validation

One entrypoint, for everyone:

```bash
bash scripts/validate.sh
```

The commands live in that script and nowhere else. Do not restate them here, in
`README.md`, or in a CI config — every caller invokes the script. Humans, agents,
git hooks, and CI therefore validate identically, and there is no second copy to
drift.

If the script reports that nothing is configured, say so plainly instead of
treating a silent pass as a green build.

---

## 10. Autonomous execution

An agent may execute a phase in a continuous loop without per-step human approval,
but only when all of the following hold:

- `AGENTS.md` Status is CONFIGURED
- The phase declares `Execution mode: AUTONOMOUS` in `PLAN.md`. A phase marked
  GATED is executed supervised, whichever prompt was pasted
- The phase's requirements came through intake and were confirmed
- The phase's success criteria are observable and binary
- `scripts/validate.sh` has real commands — a loop with no deterministic exit
  condition is not autonomous, it is unsupervised
- Work happens on a branch, never directly on the default branch

### The loop may not change its own exit condition

While looping, the agent must not edit requirements, success criteria, deliverables,
dependencies, or execution mode in `PLAN.md`. Status fields only. In particular, a
loop may never promote a phase from GATED to AUTONOMOUS.

If the plan turns out to be wrong, that is a stop condition, not something to fix in
passing. Report the problem and wait. An agent that can rewrite the definition of
done has no definition of done.

### Stop conditions

Halt the loop and return to the human on any of these:

- A requirement contradiction, or a plan that cannot be satisfied as written
- Anything destructive or irreversible: schema migrations against real data, force
  pushes, infrastructure teardown, deletion outside the working tree
- Anything touching credentials, payments, or third-party accounts
- Work that is not in the current phase's deliverables — including "while I was in
  here" improvements
- The same check failing three iterations in a row. Repeated failure means the
  approach is wrong; looping harder will not fix it
- Iteration budget exhausted

State which condition fired. Do not resume on your own.

### Scope

Autonomy applies to execution only. Intake, architecture selection, and any
unresolved product decision stay in the human loop — a loop reinforces whatever
interpretation it started with, so a wrong reading gets more entrenched with each
pass rather than corrected.

---

## 11. Phase execution procedure

Applies to every phase, supervised or autonomous. The prompts in `prompts/` choose
which mode you are in; this section defines what happens in both.

### Before writing code

1. Confirm Status is CONFIGURED. If not, stop and run intake.
2. Restate the phase goal, deliverables, and success criteria in your own words.
3. Confirm every phase in this phase's Dependencies is complete. Do not assume a
   dependency on phase N-1 that `PLAN.md` does not declare.
4. Name which capabilities you will use, and for what.
5. If any success criterion is not observable and binary, fix it with the human
   before starting. In autonomous mode this is a stop condition, not a repair.

### While working

Follow §3. Smallest change that satisfies the requirement. Tests first for new
behavior where tests are configured. Look up current documentation before writing
against any library. Stay inside the phase's declared deliverables.

### On completion

- Run `bash scripts/validate.sh` and paste the actual output. Never claim passing
  without it. If nothing is configured, say so rather than treating the zero exit
  as a green build.
- State the evidence for each success criterion — the command run, the behavior
  exercised, or the file inspected.
- Update the documents listed under "Documents to update on completion", plus
  anything else the change contradicted (§5).
- Update the phase Status in `PLAN.md`.
- Walk the §8 checklist item by item, marking anything unsatisfied and why.

Then stop. Do not begin the next phase, even if its dependencies are now met.
