# Review

Paste after a phase is implemented, before considering it done.

---

Review the changes made in this phase. Use the code review and security review
capabilities from `CLAUDE.md`.

Report in this order, most severe first:

```
CORRECTNESS
  <does it do what the success criteria require>

SECURITY
  <against AGENTS.md section 7 — auth, input, secrets, exposure>

DOCUMENT DRIFT
  <any source-of-truth file that no longer matches the code>

UNNECESSARY COMPLEXITY
  <abstractions, dependencies, or config no current requirement needs>

RISKS I AM CARRYING
  <what could bite later, stated plainly>
```

Rules for this review:

- Do not review your own work approvingly by default. Assume something is wrong and
  go find it.
- Report problems you cannot fix as well as ones you can.
- If you disagree with a requirement, say so here rather than silently working
  around it.
- An empty section is a valid result. Do not manufacture findings to fill it.

Do not fix anything yet. Report first, then wait.
