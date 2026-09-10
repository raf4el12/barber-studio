# Domain Docs

How the engineering skills consume this repo's domain documentation.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root. Contains ubiquitous language, core concepts, and terminology guidelines for Barber Studio.
- **`docs/adr/`** — architectural decision records:
  - `0001-multi-branch-shared-catalog-local-inventory.md`
  - `0002-immutable-ticket-and-stock-ledgers.md`
  - `0003-hierarchical-deterministic-commission-engine.md`
  - `0004-explicit-use-case-audit-logging-over-interceptors.md`

## File structure

Single-context repo:

```
/
├── CONTEXT.md
├── docs/adr/
├── apps/
│   ├── api/
│   └── web/
└── .scratch/
```

## Terminology Rule

Always use the glossary's vocabulary from `CONTEXT.md` (`Ticket`, `Queue Entry`, `Branch`, `Staff Member`, `Barber Payout`, `Cash Register`, `Stock Movement`). Avoid forbidden synonyms documented in `CONTEXT.md`.
