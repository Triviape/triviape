# Agent Instructions

**Engineering work is sequenced in [docs/GUIDE.md](./docs/GUIDE.md)** (phases, file-level tasks, product epics `FC-*` / `LB-*`). Start there before ad-hoc refactors.

**Optional:** The repo may include **bd** (beads) for dependency-aware issues. It is **not required** for delivery. If `bd` commands fail (Dolt/database), **skip beads** and use GUIDE.md milestones plus normal git workflow.

## Quick Reference

```bash
# Primary
cat docs/GUIDE.md           # Current delivery order & phase items

# Optional (when beads is healthy)
bd ready
bd show <id>
bd close <id>
```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **Track follow-ups** — Add GUIDE items or GitHub issues for anything not finished (beads optional).
2. **Run quality gates** (if code changed) — Tests, linters, builds.
3. **PUSH TO REMOTE** — This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
4. **Clean up** — Clear stashes, prune remote branches.
5. **Verify** — All changes committed AND pushed.
6. **Hand off** — Brief summary for the next session.

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds.
- NEVER stop before pushing — that leaves work stranded locally.
- NEVER say "ready to push when you are" — YOU must push.
- If push fails, resolve and retry until it succeeds.
