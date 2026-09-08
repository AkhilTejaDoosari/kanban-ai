# Execute Phase — GATED

Use for supervised phase-by-phase execution.

```text
MODE: GATED / SUPERVISED
Execute exactly one eligible PLAN.md phase.
After validation, documentation, progress update, and verification: STOP.
Do not begin another phase.
```

Execute Phase <N> from `PLAN.md`, following `AGENTS.md`.

Before implementation:
- confirm dependencies are complete
- restate goal/deliverables/success criteria
- show the implementation approach briefly
- identify relevant capabilities

During implementation, check with the human before any change outside the phase deliverables or any new cost/service decision not already approved.

On completion:
- run `bash scripts/validate.sh`
- show evidence for each success criterion
- update affected canonical docs
- append a concise entry to `PROGRESS.md`
- update PLAN status
- stop
