import { Inject, Injectable } from '@nestjs/common';
import type { Customer, LoyaltyTransaction } from '@prisma/client';
import {
  EXTENDED_PRISMA,
  type ExtendedPrismaService,
} from '../../../../prisma/prisma.service';
import type {
  AccruePointsData,
  ICustomerRepository,
} from '../../domain/repositories/customer.repository';
import type {
  CreateCustomerData,
  UpdateCustomerData,
} from '../../domain/interfaces/customer-data.interface';
import {
  CustomerEntity,
  LoyaltyTransactionEntity,
} from '../../domain/entities/customer.entity';

@Injectable()
export class PrismaCustomerRepository implements ICustomerRepository {
  constructor(
    @Inject(EXTENDED_PRISMA) private readonly prisma: ExtendedPrismaService,
  ) {}

  async create(data: CreateCustomerData): Promise<CustomerEntity> {
    return this.toEntity(await this.prisma.customer.create({ data }));
  }

  async findAll(branchId?: string): Promise<CustomerEntity[]> {
    const rows = await this.prisma.customer.findMany({
      where: branchId ? { branchId } : undefined,
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<CustomerEntity | null> {
    const row = await this.prisma.customer.findFirst({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    return (
      (await this.prisma.customer.count({
        where: { email, ...(excludeId && { id: { not: excludeId } }) },
      })) > 0
    );
  }

  async existsByPhone(phone: string, excludeId?: string): Promise<boolean> {
    return (
      (await this.prisma.customer.count({
        where: { phone, ...(excludeId && { id: { not: excludeId } }) },
      })) > 0
    );
  }

  async update(id: string, data: UpdateCustomerData): Promise<CustomerEntity> {
    return this.toEntity(
      await this.prisma.customer.update({ where: { id }, data }),
    );
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async addTransaction(data: AccruePointsData): Promise<{
    transaction: LoyaltyTransactionEntity;
    balance: number;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          customerId: data.customerId,
          points: data.points,
          reason: data.reason,
          ticketId: data.ticketId ?? null,
        },
      });
      const aggregate = await tx.loyaltyTransaction.aggregate({
        _sum: { points: true },
        where: { customerId: data.customerId },
      });
      const balance = aggregate._sum.points ?? 0;
      await tx.customer.update({
        where: { id: data.customerId },
        data: { loyaltyPoints: balance },
      });
      return { transaction: this.toTransaction(transaction), balance };
    });
  }

  async getBalance(customerId: string): Promise<number> {
    const aggregate = await this.prisma.loyaltyTransaction.aggregate({
      _sum: { points: true },
      where: { customerId },
    });
    return aggregate._sum.points ?? 0;
  }

  async listTransactions(
    customerId: string,
  ): Promise<LoyaltyTransactionEntity[]> {
    const rows = await this.prisma.loyaltyTransaction.findMany({
      where: { customerId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.toTransaction(r));
  }

  private toEntity(row: Customer): CustomerEntity {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      notes: row.notes,
      loyaltyPoints: row.loyaltyPoints,
      isActive: row.isActive,
      branchId: row.branchId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
  }

  private toTransaction(row: LoyaltyTransaction): LoyaltyTransactionEntity {
    return {
      id: row.id,
      customerId: row.customerId,
      points: row.points,
      reason: row.reason,
      ticketId: row.ticketId,
      createdAt: row.createdAt,
    };
  }
}
