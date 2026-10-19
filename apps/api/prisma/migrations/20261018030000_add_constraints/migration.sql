-- Enforce at most one OWNER per workspace (Step 4 single source of truth).
CREATE UNIQUE INDEX "WorkspaceMember_one_owner_per_workspace"
  ON "WorkspaceMember" ("workspaceId")
  WHERE role = 'OWNER';

-- Notification entityType / entityId must be set together or both null.
ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_entity_pair_check"
  CHECK (("entityType" IS NULL) = ("entityId" IS NULL));
