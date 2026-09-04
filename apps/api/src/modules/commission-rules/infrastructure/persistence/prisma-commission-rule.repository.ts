import { Inject, Injectable } from '@nestjs/common';
import type { CommissionRule } from '@prisma/client';
import {
  EXTENDED_PRISMA,
  type ExtendedPrismaService,
} from '../../../../prisma/prisma.service';
import type { ICommissionRuleRepository } from '../../domain/repositories/commission-rule.repository';
import type {
  CreateCommissionRuleData,
  UpdateCommissionRuleData,
} from '../../domain/interfaces/commission-rule-data.interface';
import { CommissionRuleEntity } from '../../domain/entities/commission-rule.entity';

@Injectable()
export class PrismaCommissionRuleRepository implements ICommissionRuleRepository {
  constructor(
    @Inject(EXTENDED_PRISMA) private readonly prisma: ExtendedPrismaService,
  ) {}

  async create(data: CreateCommissionRuleData): Promise<CommissionRuleEntity> {
    const row = await this.prisma.commissionRule.create({ data });
    return this.toEntity(row);
  }

  async findAll(): Promise<CommissionRuleEntity[]> {
    const rows = await this.prisma.commissionRule.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<CommissionRuleEntity | null> {
    const row = await this.prisma.commissionRule.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async update(
    id: string,
    data: UpdateCommissionRuleData,
  ): Promise<CommissionRuleEntity> {
    const row = await this.prisma.commissionRule.update({
      where: { id },
      data,
    });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.commissionRule.delete({ where: { id } });
  }

  private toEntity(row: CommissionRule): CommissionRuleEntity {
    return {
      id: row.id,
      name: row.name,
      priority: row.priority,
      type: row.type,
      value: Number(row.value),
      isActive: row.isActive,
      barberId: row.barberId,
      serviceId: row.serviceId,
      serviceCategoryId: row.serviceCategoryId,
      productId: row.productId,
      branchId: row.branchId,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
