# Changelog

## 1.4.0

Lessons extracted from the first real Bulletproof project:

- add cost-awareness gate with `$0/month` default budget
- require service-cost table, estimated monthly total, free alternatives, and variable-cost flags before architecture approval
- add `PROGRESS.md` for chronological execution history and long-project continuity
- refine Claude env permissions so real `.env*` secret files stay protected while `.env.example` remains writable/committable
- add GitHub Actions CI scaffold and require CI to call the canonical `scripts/validate.sh`
- add repository-structure discipline and a plain-English repo map
- add adaptive rigor profiles: LEAN, STANDARD, STRICT
- prefer the simplest viable architecture; do not invent separate frontend/backend apps for cosmetic organization
- add cost/service drift and unnecessary-complexity checks to review/final verification
- keep GATED and AUTONOMOUS/Ralph execution modes with immutable success criteria and stop conditions

## 1.3.0

- gated and autonomous execution modes documented per phase
- Ralph/autonomous stop conditions and immutable success criteria
- centralized validation entrypoint
- repository documentation model and capability routing
