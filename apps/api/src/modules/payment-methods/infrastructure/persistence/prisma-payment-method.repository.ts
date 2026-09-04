import { Inject, Injectable } from '@nestjs/common';
import type { PaymentMethod } from '@prisma/client';
import {
  EXTENDED_PRISMA,
  type ExtendedPrismaService,
} from '../../../../prisma/prisma.service';
import type { IPaymentMethodRepository } from '../../domain/repositories/payment-method.repository';
import type {
  CreatePaymentMethodData,
  UpdatePaymentMethodData,
} from '../../domain/interfaces/payment-method-data.interface';
import { PaymentMethodEntity } from '../../domain/entities/payment-method.entity';

@Injectable()
export class PrismaPaymentMethodRepository implements IPaymentMethodRepository {
  constructor(
    @Inject(EXTENDED_PRISMA) private readonly prisma: ExtendedPrismaService,
  ) {}

  async create(data: CreatePaymentMethodData): Promise<PaymentMethodEntity> {
    return this.toEntity(await this.prisma.paymentMethod.create({ data }));
  }

  async findAll(isActive?: boolean): Promise<PaymentMethodEntity[]> {
    const rows = await this.prisma.paymentMethod.findMany({
      where: isActive === undefined ? undefined : { isActive },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<PaymentMethodEntity | null> {
    const row = await this.prisma.paymentMethod.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByCode(code: string): Promise<PaymentMethodEntity | null> {
    const row = await this.prisma.paymentMethod.findUnique({ where: { code } });
    return row ? this.toEntity(row) : null;
  }

  async update(
    id: string,
    data: UpdatePaymentMethodData,
  ): Promise<PaymentMethodEntity> {
    return this.toEntity(
      await this.prisma.paymentMethod.update({ where: { id }, data }),
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.paymentMethod.delete({ where: { id } });
  }

  async hasPayments(id: string): Promise<boolean> {
    return (
      (await this.prisma.payment.count({ where: { paymentMethodId: id } })) > 0
    );
  }

  private toEntity(row: PaymentMethod): PaymentMethodEntity {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
