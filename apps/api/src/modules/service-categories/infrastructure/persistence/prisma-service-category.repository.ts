import { Inject, Injectable } from '@nestjs/common';
import type { ServiceCategory } from '@prisma/client';
import {
  EXTENDED_PRISMA,
  type ExtendedPrismaService,
} from '../../../../prisma/prisma.service';
import type { IServiceCategoryRepository } from '../../domain/repositories/service-category.repository';
import type {
  CreateServiceCategoryData,
  UpdateServiceCategoryData,
} from '../../domain/interfaces/service-category-data.interface';
import { ServiceCategoryEntity } from '../../domain/entities/service-category.entity';

@Injectable()
export class PrismaServiceCategoryRepository implements IServiceCategoryRepository {
  constructor(
    @Inject(EXTENDED_PRISMA) private readonly prisma: ExtendedPrismaService,
  ) {}

  async create(
    data: CreateServiceCategoryData,
  ): Promise<ServiceCategoryEntity> {
    const row = await this.prisma.serviceCategory.create({ data });
    return this.toEntity(row);
  }

  async findAll(): Promise<ServiceCategoryEntity[]> {
    const rows = await this.prisma.serviceCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<ServiceCategoryEntity | null> {
    const row = await this.prisma.serviceCategory.findFirst({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async existsByName(name: string): Promise<boolean> {
    return (await this.prisma.serviceCategory.count({ where: { name } })) > 0;
  }

  async update(
    id: string,
    data: UpdateServiceCategoryData,
  ): Promise<ServiceCategoryEntity> {
    const row = await this.prisma.serviceCategory.update({
      where: { id },
      data,
    });
    return this.toEntity(row);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.serviceCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private toEntity(row: ServiceCategory): ServiceCategoryEntity {
    return {
      id: row.id,
      name: row.name,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
  }
}
