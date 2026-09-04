import type { AuditLogEntity } from '../entities/audit-log.entity';
import type {
  AuditFilters,
  WriteAuditData,
} from '../interfaces/audit-data.interface';

export const AUDIT_LOG_REPOSITORY = 'IAuditLogRepository';

export interface IAuditLogRepository {
  write(data: WriteAuditData): Promise<AuditLogEntity>;
  findAll(
    filters: AuditFilters,
    page: number,
    limit: number,
  ): Promise<{
    data: AuditLogEntity[];
    total: number;
  }>;
}
