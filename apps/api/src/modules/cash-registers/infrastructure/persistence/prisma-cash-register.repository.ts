import { Inject, Injectable } from '@nestjs/common';
import type { CashRegister } from '@prisma/client';
import {
  EXTENDED_PRISMA,
  type ExtendedPrismaService,
} from '../../../../prisma/prisma.service';
import type { ICashRegisterRepository } from '../../domain/repositories/cash-register.repository';
import type { OpenCashRegisterData } from '../../domain/interfaces/cash-register-data.interface';
import { CashRegisterEntity } from '../../domain/entities/cash-register.entity';

@Injectable()
export class PrismaCashRegisterRepository implements ICashRegisterRepository {
  constructor(
    @Inject(EXTENDED_PRISMA) private readonly prisma: ExtendedPrismaService,
  ) {}

  async open(data: OpenCashRegisterData): Promise<CashRegisterEntity> {
    return this.toEntity(await this.prisma.cashRegister.create({ data }));
  }

  async findActive(branchId: string): Promise<CashRegisterEntity | null> {
    const row = await this.prisma.cashRegister.findFirst({
      where: { branchId, closedAt: null },
      orderBy: { openedAt: 'desc' },
    });
    return row ? this.toEntity(row) : null;
  }

  async findById(id: string): Promise<CashRegisterEntity | null> {
    const row = await this.prisma.cashRegister.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByBranch(branchId: string): Promise<CashRegisterEntity[]> {
    const rows = await this.prisma.cashRegister.findMany({
      where: { branchId },
      orderBy: { openedAt: 'desc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async close(
    id: string,
    data: {
      closedById: string;
      closingCountedCash: number;
      notes?: string | null;
    },
  ): Promise<CashRegisterEntity> {
    return this.toEntity(
      await this.prisma.cashRegister.update({
        where: { id },
        data: { ...data, closedAt: new Date() },
      }),
    );
  }

  private toEntity(row: CashRegister): CashRegisterEntity {
    return {
      id: row.id,
      branchId: row.branchId,
      openedById: row.openedById,
      openingAmount: Number(row.openingAmount),
      openedAt: row.openedAt,
      closedById: row.closedById,
      closingCountedCash:
        row.closingCountedCash === null ? null : Number(row.closingCountedCash),
      closedAt: row.closedAt,
      notes: row.notes,
    };
  }
}
