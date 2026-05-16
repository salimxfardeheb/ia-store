-- CreateTable
CREATE TABLE "AuditLog" (
    "id"       TEXT         NOT NULL,
    "actorId"  TEXT         NOT NULL,
    "action"   TEXT         NOT NULL,
    "entity"   TEXT         NOT NULL,
    "entityId" TEXT         NOT NULL,
    "diff"     JSONB,
    "at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX "AuditLog_actorId_idx"          ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_at_idx"               ON "AuditLog"("at");
