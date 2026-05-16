import { prisma } from "./prisma";
import { Prisma } from "@/app/generated/prisma/client";

export type AuditAction =
  | "order.status_changed"
  | "product.updated"
  | "product.deleted"
  | "user.role_changed"
  | "user.deleted";

type AuditDiff = Record<string, unknown>;

/**
 * Write an audit log entry. Called after the primary DB write succeeds.
 * Fire-and-forget with silent catch — a logging failure must never break
 * the business operation that triggered it.
 */
export function audit(
  actorId:  string,
  action:   AuditAction,
  entity:   string,
  entityId: string,
  diff?:    AuditDiff,
): void {
  prisma.auditLog
    .create({
      data: {
        actorId,
        action,
        entity,
        entityId,
        diff: diff ? (diff as unknown as Prisma.InputJsonValue) : undefined,
      },
    })
    .catch((err) => {
      console.error("[audit] Failed to write audit log:", { action, entity, entityId, err });
    });
}
