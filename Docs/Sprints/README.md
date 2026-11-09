# Sprint Documentation

Sprint reports record what each sprint delivered, how it was verified, and what carries forward. They are the narrative companion to `Decisions.md` (durable decisions) and the technical docs under `Docs/`.

## Index

| Sprint | Theme                  | Status      | Report                           |
| ------ | ---------------------- | ----------- | -------------------------------- |
| 0      | Foundation and tooling | Completed   | [`sprint-0.md`](sprint-0.md)     |
| 1      | Authentication         | In progress | Deferred until the sprint closes |

## Process

1. Write or update the sprint report at sprint close, using [`TEMPLATE.md`](TEMPLATE.md).
2. Treat git history as the source of truth. Cite commit SHAs and the merge commit.
3. Record verification commands and actual results, including what was not run and why.
4. Log durable decisions in `Decisions.md`, not in the sprint report. Link to them instead of duplicating the rationale.
5. List gaps, risks, and carryover explicitly so the next sprint starts with a clear backlog.
6. Update the index table when a report is added or its status changes.
7. Update the report if a later sprint invalidates something it claims.

In-progress sprints are not documented in detail. The index carries a one-line status until the sprint closes.

## Status values

| Status      | Meaning                                  |
| ----------- | ---------------------------------------- |
| Planned     | Scoped but not started                   |
| In progress | Work has started; no detailed report yet |
| Completed   | Merged and verified; report exists       |
| Cancelled   | Stopped; report explains why             |

## Naming and location

- Directory: `Docs/Sprints/`
- Report file: `sprint-N.md` (for example, `sprint-0.md`, `sprint-1.md`)
- One file per sprint. Do not append multiple sprints to one file.
- Use relative links so the docs render correctly on GitHub and locally.

## What belongs where

| Content                                             | Location                   |
| --------------------------------------------------- | -------------------------- |
| Sprint goals, deliverables, verification, carryover | `Docs/Sprints/sprint-N.md` |
| Durable architectural or product decisions          | `Decisions.md`             |
| Database design and rules                           | `Docs/Database/`           |
| API contracts                                       | `Docs/api/`                |
| App-specific setup                                  | `apps/*/README.md`         |
| Cross-cutting docs index                            | `Docs/README.md`           |

## Writing guidelines

- Lead with the outcome, then the detail.
- Use tables for status, verification, and decisions.
- Prefer concrete file paths, commit SHAs, and commands over prose.
- State what was not verified. Do not imply a check passed because it is defined in CI.
- Keep the report useful to someone who was not in the sprint.
