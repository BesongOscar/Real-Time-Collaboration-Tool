# Documentation

This directory holds the cross-cutting documentation for the Real-Time Collaboration Tool. App-specific setup lives in each app's README.

## Start here

| Document                                   | What it covers                                                     |
| ------------------------------------------ | ------------------------------------------------------------------ |
| [`Sprints/`](Sprints/README.md)            | Sprint reports, status, and the documentation process              |
| [`Database/schema.md`](Database/schema.md) | Data model, relationships, delete rules, indexes, and DB backstops |
| [`api/auth.md`](api/auth.md)               | Authentication API contract and client session rules               |
| [`../Decisions.md`](../Decisions.md)       | Durable architectural and product decisions with rationale         |

## Conventions

- **One topic per file.** Keep sprint narrative out of design docs and design rationale out of sprint reports.
- **Update docs in the same change as behavior.** A schema or API change without a doc update is incomplete.
- **Decisions go to `Decisions.md`.** Sprint reports link to the decision instead of restating the rationale.
- **State verification honestly.** Include the command and the result. Say when something was not run.
- **Use relative links** so the docs work on GitHub and in a local editor.
- **Match the repository casing.** The directory is `Docs/`; paths inside docs should use the real case.

## Structure

```text
Docs/
  README.md            # this file
  Sprints/
    README.md          # sprint index and process
    TEMPLATE.md        # reusable sprint report template
    sprint-0.md        # completed sprint report
  Database/
    schema.md          # database design and rules
  api/
    auth.md            # auth API contract
```

## Planned documents

These are not written yet. Add them as the corresponding features land.

| Document                                      | When                                  |
| --------------------------------------------- | ------------------------------------- |
| Realtime events contract (Socket.IO)          | Before the realtime sprint            |
| Workspace and membership API contract         | Before workspace endpoints ship       |
| Task API contract                             | Before task endpoints ship            |
| Deployment and environment guide              | Before the first deployed environment |
| Testing strategy and coverage policy          | Before coverage gates are enforced    |
| Operations runbook (logs, backups, incidents) | Before production use                 |
