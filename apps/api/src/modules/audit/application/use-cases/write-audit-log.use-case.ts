import { Inject, Injectable } from '@nestjs/common';
import {
  AUDIT_LOG_REPOSITORY,
  type IAuditLogRepository,
} from '../../domain/repositories/audit.repository';
import type { WriteAuditData } from '../../domain/interfaces/audit-data.interface';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'accessToken',
]);

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        SENSITIVE_KEYS.has(key) ? '[redacted]' : sanitize(entry),
      ]),
    );
  }
  return value;
}

@Injectable()
export class WriteAuditLogUseCase {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY) private readonly audit: IAuditLogRepository,
  ) {}

  execute(data: WriteAuditData) {
    return this.audit.write({
      userId: data.userId ?? null,
      branchId: data.branchId ?? null,
      action: data.action,
      entityType: data.entityType ?? null,
      entityId: data.entityId ?? null,
      metadata: sanitize(data.metadata ?? null) as Record<
        string,
        unknown
      > | null,
    });
  }
}
