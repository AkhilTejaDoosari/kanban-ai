# Final Verification

Paste when the project — or a release — is claimed complete.

---

Verify completion. Use the verification capability from `CLAUDE.md`.

Evidence only. A claim without command output is not evidence.

1. Run `bash scripts/validate.sh`. Paste the real output.
2. Walk every unchecked success criterion across all phases in `PLAN.md`. For each,
   state how it was verified — the command run, the behavior exercised, or the file
   inspected.
3. Confirm each source-of-truth document matches the code as it stands now
   (`AGENTS.md` §2 table).
4. Confirm no secrets are committed and `.env.example` contains placeholders only.
5. Confirm `scripts/validate.sh` contains this project's real commands. A project
   that reaches verification with nothing configured has no deterministic gate —
   report that as NOT VERIFIED, not as a pass.

Then output:

```
VERIFIED
  <criteria demonstrably met, with evidence>

NOT VERIFIED
  <criteria that could not be demonstrated, and why>

DRIFT FOUND
  <documents corrected, or still needing correction>
```

If anything is in NOT VERIFIED, the project is not complete. Say that plainly rather
than concluding on a positive note.
