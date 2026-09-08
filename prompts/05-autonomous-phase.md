# Execute Phase — autonomous

Paste to run a confirmed phase unattended. For supervised work use
`02-execute-phase.md` instead.

---

```
MODE: AUTONOMOUS / LOOP
Execute the selected phase until every immutable success criterion is verified,
or a stop condition in AGENTS.md section 10 is reached.
This grants execution authority, not product authority.
Do not continue into another phase.
```

Execute Phase <N> from `PLAN.md`, following `AGENTS.md` §11 and §10.

## Preflight — report this table, then start

Stop if any row fails. Do not start the loop on a failed preflight. If the phase is
marked GATED, execute it supervised under `02-execute-phase.md` instead — do not
change the mode field to proceed.

```
Status CONFIGURED in AGENTS.md      yes / no
Phase marked AUTONOMOUS in PLAN.md   yes / no
Phase requirements confirmed         yes / no
Success criteria observable+binary   yes / no
scripts/validate.sh configured       yes / no
On a branch, not the default branch  yes / no  (branch name)
Iteration budget                     <N>
```

Then restate the success criteria verbatim. They are your exit condition and you may
not modify them — Status is the only field in `PLAN.md` you may touch (§10).

## Loop

Each iteration: implement the smallest increment toward an unmet criterion, run
`bash scripts/validate.sh`, fix causes rather than weakening checks, re-run. Log one
line per iteration: number, what changed, validation result.

Continue until every success criterion is met, or a §10 stop condition fires. Name
which one fired and stop.

## On completion

Everything in §11, plus the iteration log and a full diff summary.
