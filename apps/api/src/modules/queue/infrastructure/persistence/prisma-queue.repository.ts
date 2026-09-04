import { Inject, Injectable } from '@nestjs/common';
import type { Prisma, QueueEntry } from '@prisma/client';
import {
  EXTENDED_PRISMA,
  type ExtendedPrismaService,
} from '../../../../prisma/prisma.service';
import type { IQueueRepository } from '../../domain/repositories/queue.repository';
import type {
  CreateQueueEntryData,
  QueueEntryFilters,
} from '../../domain/interfaces/queue-entry-data.interface';
import { QueueEntryEntity } from '../../domain/entities/queue-entry.entity';

@Injectable()
export class PrismaQueueRepository implements IQueueRepository {
  constructor(
    @Inject(EXTENDED_PRISMA) private readonly prisma: ExtendedPrismaService,
  ) {}

  async create(data: CreateQueueEntryData): Promise<QueueEntryEntity> {
    const row = await this.prisma.queueEntry.create({ data });
    return this.toEntity(row);
  }

  async findAll(filters: QueueEntryFilters): Promise<QueueEntryEntity[]> {
    const status = filters.status;
    const where: Prisma.QueueEntryWhereInput = {
      branchId: filters.branchId,
      ...(status !== undefined && {
        status: Array.isArray(status) ? { in: status } : status,
      }),
      ...(filters.assignedBarberId !== undefined && {
        assignedBarberId: filters.assignedBarberId,
      }),
    };
    const rows = await this.prisma.queueEntry.findMany({
      where,
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<QueueEntryEntity | null> {
    const row = await this.prisma.queueEntry.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async assignBarber(id: string, barberId: string): Promise<QueueEntryEntity> {
    const row = await this.prisma.queueEntry.update({
      where: { id },
      data: { assignedBarberId: barberId },
    });
    return this.toEntity(row);
  }

  async updateStatus(
    id: string,
    data: {
      status: QueueEntryEntity['status'];
      calledAt?: Date | null;
      closedAt?: Date | null;
    },
  ): Promise<QueueEntryEntity> {
    const row = await this.prisma.queueEntry.update({ where: { id }, data });
    return this.toEntity(row);
  }

  countCompletedByBarberSince(
    barberId: string,
    branchId: string,
    since: Date,
  ): Promise<number> {
    return this.prisma.queueEntry.count({
      where: {
        assignedBarberId: barberId,
        branchId,
        status: 'COMPLETED',
        closedAt: { gte: since },
      },
    });
  }

  private toEntity(row: QueueEntry): QueueEntryEntity {
    return {
      id: row.id,
      branchId: row.branchId,
      status: row.status,
      position: row.position,
      customerId: row.customerId,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      assignedBarberId: row.assignedBarberId,
      createdAt: row.createdAt,
      calledAt: row.calledAt,
      closedAt: row.closedAt,
    };
  }
}
