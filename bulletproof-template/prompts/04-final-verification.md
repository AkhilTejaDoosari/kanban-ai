# Final Verification

Use before calling a project/release complete.

Do not modify code during this pass unless the human explicitly asks for fixes after the report.

Verify:

1. every complete PLAN phase has evidence for all success criteria
2. `bash scripts/validate.sh` exits zero and is actually configured
3. CI is green if CI is configured
4. critical E2E flows required by the selected rigor profile pass
5. no secret-bearing env files are tracked
6. `.env.example` contains placeholders only
7. README, ARCHITECTURE, DESIGN, DECISIONS, PLAN, and PROGRESS match current reality
8. no paid/usage-metered service was introduced outside the approved cost model
9. the repository layout is understandable and generated artifacts are ignored
10. open blockers/risks are stated plainly

Report:

```text
VERIFICATION RESULT: PASS | FAIL | BLOCKED

VALIDATION
CI
SUCCESS CRITERIA
SECURITY
COST MODEL
DOCUMENTATION / PROGRESS
REPOSITORY HYGIENE
OPEN RISKS
```

Do not call PASS unless every applicable gate is supported by fresh evidence.
