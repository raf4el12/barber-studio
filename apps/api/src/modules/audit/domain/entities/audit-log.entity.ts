export class AuditLogEntity {
  id!: string;
  userId!: string | null;
  branchId!: string | null;
  action!: string;
  entityType!: string | null;
  entityId!: string | null;
  metadata!: Record<string, unknown> | null;
  createdAt!: Date;
}
