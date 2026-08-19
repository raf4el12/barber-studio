import { Inject, Injectable } from '@nestjs/common';
import type { Service } from '@prisma/client';
import {
  EXTENDED_PRISMA,
  type ExtendedPrismaService,
} from '../../../../prisma/prisma.service';
import type { IServiceRepository } from '../../domain/repositories/service.repository';
import type {
  CreateServiceData,
  UpdateServiceData,
} from '../../domain/interfaces/service-data.interface';
import { ServiceEntity } from '../../domain/entities/service.entity';

@Injectable()
export class PrismaServiceRepository implements IServiceRepository {
  constructor(
    @Inject(EXTENDED_PRISMA) private readonly prisma: ExtendedPrismaService,
  ) {}

  async create(data: CreateServiceData): Promise<ServiceEntity> {
    const row = await this.prisma.service.create({ data });
    return this.toEntity(row);
  }

  async findAll(categoryId?: string): Promise<ServiceEntity[]> {
    const rows = await this.prisma.service.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<ServiceEntity | null> {
    const row = await this.prisma.service.findFirst({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async existsByName(name: string): Promise<boolean> {
    return (await this.prisma.service.count({ where: { name } })) > 0;
  }

  async update(id: string, data: UpdateServiceData): Promise<ServiceEntity> {
    const row = await this.prisma.service.update({
      where: { id },
      data,
    });
    return this.toEntity(row);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.service.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private toEntity(row: Service): ServiceEntity {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: Number(row.price),
      durationMinutes: row.durationMinutes,
      isActive: row.isActive,
      categoryId: row.categoryId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
  }
}
