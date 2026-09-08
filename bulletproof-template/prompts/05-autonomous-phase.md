# Execute Phase — AUTONOMOUS / Ralph

Use only for a PLAN.md phase explicitly marked `Execution mode: AUTONOMOUS`.

```text
MODE: AUTONOMOUS
Execute exactly one eligible phase until:
1. every immutable success criterion is verified, or
2. an AGENTS.md stop condition fires.
Do not begin another phase.
```

Preflight:
- project is CONFIGURED
- dependencies complete
- phase mode is AUTONOMOUS
- success criteria are observable/binary
- `scripts/validate.sh` has real commands
- work is on a non-default branch

Loop:
1. make the smallest coherent change
2. run the relevant targeted checks
3. diagnose failures systematically
4. continue only while the approach remains valid
5. run full `bash scripts/validate.sh` before completion

The loop may not edit requirements, deliverables, dependencies, execution mode, budget, approved architecture, or success criteria.

Stop immediately for destructive/irreversible actions, new paid-service decisions, credentials/accounts/payments, scope creep, repeated failure, or exhausted iteration budget.

On completion:
- show evidence for each success criterion
- update affected docs
- append to `PROGRESS.md`
- update PLAN status
- stop
