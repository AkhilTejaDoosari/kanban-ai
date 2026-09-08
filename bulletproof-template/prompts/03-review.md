# Review

Use after a phase is implemented, before considering it done.

Review the phase using the strongest available code-review and security-review capabilities.

Report in this order:

```text
CORRECTNESS
SECURITY
DOCUMENT / PROGRESS DRIFT
COST / SERVICE DRIFT
UNNECESSARY COMPLEXITY
RISKS I AM CARRYING
```

Rules:
- verify against PLAN success criteria, not intent alone
- flag any newly introduced paid/usage-metered service not approved in architecture
- flag stale `PROGRESS.md`, README, architecture, design, or decisions
- explicitly look for complexity that exceeds the selected rigor profile
- do not manufacture findings
- do not fix anything yet

Report first, then wait.
