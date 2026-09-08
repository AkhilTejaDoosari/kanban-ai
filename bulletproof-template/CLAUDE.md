@AGENTS.md

Read and apply the imported policy first. This file only maps portable policy needs to Claude Code capabilities installed globally on this machine.

# Claude Adapter

| Policy need | Capability |
|---|---|
| structured brainstorming | `superpowers:brainstorming` |
| plan writing | `superpowers:writing-plans` |
| plan execution | `superpowers:executing-plans` |
| frontend design | `frontend-design` |
| systematic debugging | `superpowers:systematic-debugging` |
| test-driven development | `superpowers:test-driven-development` |
| current documentation | `context7` |
| security review | `security-guidance` or the strongest available equivalent |
| code review | `code-review` |
| verification | `superpowers:verification-before-completion` |
| simplification | `code-simplifier` |

If a mapped capability is unavailable, state that explicitly and perform the equivalent workflow manually. Do not duplicate engineering policy here.
