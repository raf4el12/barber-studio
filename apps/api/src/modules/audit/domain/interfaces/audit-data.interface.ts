export interface WriteAuditData {
  userId?: string | null;
  branchId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface AuditFilters {
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  branchId?: string;
  from?: Date;
  to?: Date;
}

export interface PagedAuditLogs {
  data: import('../entities/audit-log.entity').AuditLogEntity[];
  total: number;
  page: number;
  limit: number;
}
