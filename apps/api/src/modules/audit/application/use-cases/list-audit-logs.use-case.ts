import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  AUDIT_LOG_REPOSITORY,
  type IAuditLogRepository,
} from '../../domain/repositories/audit.repository';
import type { AuditFilters } from '../../domain/interfaces/audit-data.interface';
import { isValidDate } from '../../../reports/application/use-cases/build-z-report.use-case';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export interface ListAuditLogsQuery {
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  branchId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ListAuditLogsUseCase {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY) private readonly audit: IAuditLogRepository,
  ) {}

  async execute(query: ListAuditLogsQuery) {
    const filters: AuditFilters = {};
    if (query.action) filters.action = query.action;
    if (query.entityType) filters.entityType = query.entityType;
    if (query.entityId) filters.entityId = query.entityId;
    if (query.userId) filters.userId = query.userId;
    if (query.branchId) filters.branchId = query.branchId;
    if (query.from) filters.from = this.parseDay(query.from);
    if (query.to) filters.to = this.parseDay(query.to, true);
    if (query.from && query.to && query.from > query.to) {
      throw new BadRequestException('from debe ser anterior a to');
    }
    const page = query.page && query.page > 0 ? Math.floor(query.page) : 1;
    const limit = Math.min(
      query.limit && query.limit > 0 ? Math.floor(query.limit) : DEFAULT_LIMIT,
      MAX_LIMIT,
    );
    const { data, total } = await this.audit.findAll(filters, page, limit);
    return { data, total, page, limit };
  }

  private parseDay(value: string, endOfDay = false): Date {
    if (!isValidDate(value)) {
      throw new BadRequestException(
        `Fecha inválida, formato esperado YYYY-MM-DD: ${value}`,
      );
    }
    const date = new Date(`${value}T00:00:00.000Z`);
    return endOfDay ? new Date(date.getTime() + 24 * 60 * 60 * 1000) : date;
  }
}
