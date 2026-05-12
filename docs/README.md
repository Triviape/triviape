# Triviape Documentation

## Start Here

**[GUIDE.md](./GUIDE.md)** — Master improvement tracker. All codebase work is planned, tracked, and logged here. Read this first at the start of every session.

## Active Documents

| Document | Purpose |
|----------|---------|
| [GUIDE.md](./GUIDE.md) | Master improvement tracker — work items, changelog, doc tracker |
| [Roadmap.md](./Roadmap.md) | Product themes and backlog (engineering sequencing stays in GUIDE) |
| [DECISIONS.md](./DECISIONS.md) | Architectural decision log with rationale and status |
| [RUNBOOKS.md](./RUNBOOKS.md) | Operational how-to guides for common tasks |

## Setup Guides

| Document | Purpose |
|----------|---------|
| [setup/firebase.md](./setup/firebase.md) | Firebase setup, emulators, and configuration |
| [setup/environment.md](./setup/environment.md) | Environment variables and local dev setup |
| [setup/ports.md](./setup/ports.md) | Port configuration for dev server and emulators |
| [setup/build.md](./setup/build.md) | Build scripts, Turbopack, and bundle analysis |

## Reference

| Document | Purpose |
|----------|---------|
| [performance-monitoring.md](./performance-monitoring.md) | Performance monitoring hooks, dashboard, and best practices |
| [architecture/](./architecture/) | System architecture, component patterns, data flow, state management |
| [patterns/](./patterns/) | Code patterns: memoization, composition, animations |
| [standards/](./standards/) | Documentation standards |

## Archive

The `archive/` directory contains completed work, superseded analyses, and static reference docs that are no longer actively maintained. These are kept for historical reference only.

**Product vs engineering:** [Roadmap.md](./Roadmap.md) holds product themes and the feature wishlist. [GUIDE.md](./GUIDE.md) owns delivery order and file-level engineering tasks. Update both when product intent or sequencing changes.

## Rules

1. **One source of truth**: GUIDE.md tracks all work. Don't create parallel tracking docs.
2. **Keep it current**: Update docs when you change behavior they describe.
3. **Delete, don't hoard**: Remove docs for features that no longer exist.
4. **Archive completed work**: Move finished plans/analyses to `archive/`.
