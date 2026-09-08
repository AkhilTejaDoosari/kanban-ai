@AGENTS.md

Read and apply the imported policy first. It is the interface; this file only
resolves it to Claude Code capabilities on this machine.

# Claude Adapter

Capabilities are installed globally (`~/.claude/`), not vendored into this repo.

| Policy need (AGENTS.md §4) | Capability |
|---|---|
| structured brainstorming | `superpowers:brainstorming` |
| plan writing | `superpowers:writing-plans` |
| plan execution | `superpowers:executing-plans` |
| frontend design | `frontend-design` |
| systematic root-cause debugging | `superpowers:systematic-debugging` |
| test-driven development | `superpowers:test-driven-development` |
| current documentation lookup | `context7` |
| security review | `security-guidance` |
| code review | `code-review` |
| verification | `superpowers:verification-before-completion` |
| simplification | `code-simplifier` |

If a capability listed above is not available in this session, state which one is
missing before proceeding, then follow the equivalent workflow manually.

No engineering rules belong in this file. If you are tempted to add one, it belongs
in `AGENTS.md`.
