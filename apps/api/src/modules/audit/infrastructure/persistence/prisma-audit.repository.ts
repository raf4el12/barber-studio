import { Inject, Injectable } from '@nestjs/common';
import type { AuditLog } from '@prisma/client';
import {
  EXTENDED_PRISMA,
  type ExtendedPrismaService,
} from '../../../../prisma/prisma.service';
import type { IAuditLogRepository } from '../../domain/repositories/audit.repository';
import type {
  AuditFilters,
  WriteAuditData,
} from '../../domain/interfaces/audit-data.interface';
import { AuditLogEntity } from '../../domain/entities/audit-log.entity';

@Injectable()
export class PrismaAuditLogRepository implements IAuditLogRepository {
  constructor(
    @Inject(EXTENDED_PRISMA) private readonly prisma: ExtendedPrismaService,
  ) {}

  async write(data: WriteAuditData): Promise<AuditLogEntity> {
    const row = await this.prisma.auditLog.create({
      data: {
        userId: data.userId ?? null,
        branchId: data.branchId ?? null,
        action: data.action,
        entityType: data.entityType ?? null,
        entityId: data.entityId ?? null,
        metadata: data.metadata ?? undefined,
      },
    });
    return this.toEntity(row);
  }

  async findAll(
    filters: AuditFilters,
    page: number,
    limit: number,
  ): Promise<{ data: AuditLogEntity[]; total: number }> {
    const where = {
      ...(filters.action !== undefined && { action: filters.action }),
      ...(filters.entityType !== undefined && {
        entityType: filters.entityType,
      }),
      ...(filters.entityId !== undefined && { entityId: filters.entityId }),
      ...(filters.userId !== undefined && { userId: filters.userId }),
      ...(filters.branchId !== undefined && { branchId: filters.branchId }),
      ...((filters.from !== undefined || filters.to !== undefined) && {
        createdAt: {
          ...(filters.from !== undefined && { gte: filters.from }),
          ...(filters.to !== undefined && { lt: filters.to }),
        },
      }),
    };
    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { data: rows.map((r) => this.toEntity(r)), total };
  }

  private toEntity(row: AuditLog): AuditLogEntity {
    return {
      id: row.id,
      userId: row.userId,
      branchId: row.branchId,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
      createdAt: row.createdAt,
    };
  }
}
