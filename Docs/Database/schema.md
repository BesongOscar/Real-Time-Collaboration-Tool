# Database Schema

Location in repo: `docs/database/schema.md`
Implements: SDLC Step 4 (Reviewed), sections 4.7 to 4.10. Where Step 3 and Step 4 differ, Step 4 wins.

## Models

| Model | Purpose | Key fields |
|---|---|---|
| `User` | Account | `email` (unique), `username` (unique), `passwordHash`, `avatarUrl` |
| `RefreshToken` | Session management | `tokenHash` (unique), `familyId`, `expiresAt`, `revokedAt` |
| `Workspace` | Tenant | `name`, `description`, `inviteCode` (unique, regenerable) |
| `WorkspaceMember` | Membership and role | `role` (OWNER / ADMIN / MEMBER), unique `(workspaceId, userId)` |
| `Message` | Workspace-level message | `content`, `deletedAt` (soft delete), `updatedAt` (edits) |
| `Task` | Task | `status`, `priority`, `assigneeId`, `createdById` |
| `Notification` | In-app notification | `type`, `entityType`, `entityId`, `isRead` |
| `File` | File metadata | `storageKey` (unique, R2 object key), `size`, `mimeType` |

## Relationship and delete rules

| Relation | On delete | Reason |
|---|---|---|
| Workspace to Member, Message, Task, File | Cascade | Step 4 §4.9: no orphaned rows |
| User to WorkspaceMember | Cascade | Membership has no meaning without the user |
| User to RefreshToken, Notification | Cascade | Personal data |
| User to Message (sender), Task (creator), File (uploader) | Restrict | Authored content keeps a valid author. The MVP has no user-delete endpoint |
| User to Task (assignee) | SetNull | Task becomes unassigned |

## Requirement traceability

| Step 4 requirement | Where it is handled |
|---|---|
| No channels | No `Channel` model; `Message.workspaceId` |
| Single source of truth for ownership | No `ownerId`; `WorkspaceMember.role = OWNER` |
| Workspace delete cascades | `onDelete: Cascade` on the four child relations |
| `Notification.entityType` | `NotificationEntityType` enum + `entityType` / `entityId` |
| Invite link, no email | `Workspace.inviteCode`; no Invitation model |
| Access + refresh tokens, hashed, rotated | `RefreshToken` model |
| Task statuses | `TODO / IN_PROGRESS / REVIEW / COMPLETED` |
| `username` + `email` unique | `@unique` on both |

## Intentional deviations and additions

These are the places where the schema does something the spec didn't state. Review each one.

1. **`RefreshToken.familyId`** (addition). Enables reuse detection: if a revoked token is presented again, revoke every token in the family. Remove it for strict parity with §4.8.
2. **Enum values for `TaskPriority` and `NotificationType`** (assumption). The spec names the fields but not the values.
3. **`File.size` is `Int`, not `BigInt`** (choice). `BigInt` can't be JSON-serialized without a custom serializer. Cap uploads well under 2 GB.
4. **`Notification.entityType` / `entityId` are nullable** (choice), so `SYSTEM` notifications with no target are valid.
5. **No `dueDate`, `completedAt`, `editedAt`, mentions, replies, or file attachments to messages/tasks.** None are in the spec. Each is a small additive migration if you decide you want it.

## Rules enforced in the service layer

1. Exactly one `OWNER` per workspace. Create it in the same transaction as the workspace; transfer ownership in one transaction (demote old, promote new).
2. The owner's membership can't be removed, and their role can't change except via ownership transfer.
3. `Task.assigneeId` must be a member of the task's workspace. When a member is removed, unassign their tasks in that workspace.
4. Role and membership are read from the database on every request, never from the JWT.
5. `entityType` and `entityId` are both set or both null.
6. Deleting a workspace or file row doesn't delete the R2 object. Delete objects first, or sweep by `storageKey`.
7. Lowercase and trim `email` and `username` on every read and write.

## Optional DB-level backstops (raw SQL in a migration)

Prisma can't express these, but the rules above are cheap to enforce in Postgres too.

```sql
-- Exactly-one-OWNER backstop: at most one OWNER per workspace.
CREATE UNIQUE INDEX "WorkspaceMember_one_owner_per_workspace"
  ON "WorkspaceMember" ("workspaceId")
  WHERE role = 'OWNER';

-- Notification entity pair must be both set or both null.
ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_entity_pair_check"
  CHECK (("entityType" IS NULL) = ("entityId" IS NULL));
```

Because the unique index applies immediately, an ownership transfer has to demote the old owner before promoting the new one, inside one transaction.

## Index rationale

| Index | Query it serves |
|---|---|
| `Message (workspaceId, createdAt, id)` | Message list and "messages since T" after reconnect |
| `Task (workspaceId, status)` | Task board filtered by status |
| `Task (assigneeId, status)` | "My open tasks" |
| `Notification (userId, isRead, createdAt)` | Unread badge and inbox order |
| `WorkspaceMember (userId)` | List the user's workspaces |
| `WorkspaceMember (workspaceId, userId)` unique | Per-request authorization check |
| `RefreshToken (tokenHash)` unique | Token lookup on refresh |

## Commands

```bash
npx prisma validate
npx prisma migrate dev --name init
```
