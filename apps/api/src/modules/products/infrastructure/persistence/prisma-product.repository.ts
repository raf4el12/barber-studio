import { Inject, Injectable } from '@nestjs/common';
import type { Product } from '@prisma/client';
import {
  EXTENDED_PRISMA,
  type ExtendedPrismaService,
} from '../../../../prisma/prisma.service';
import type { IProductRepository } from '../../domain/repositories/product.repository';
import type {
  CreateProductData,
  UpdateProductData,
} from '../../domain/interfaces/product-data.interface';
import { ProductEntity } from '../../domain/entities/product.entity';

@Injectable()
export class PrismaProductRepository implements IProductRepository {
  constructor(
    @Inject(EXTENDED_PRISMA) private readonly prisma: ExtendedPrismaService,
  ) {}

  async create(data: CreateProductData): Promise<ProductEntity> {
    const row = await this.prisma.product.create({ data });
    return this.toEntity(row);
  }

  async findAll(): Promise<ProductEntity[]> {
    const rows = await this.prisma.product.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<ProductEntity | null> {
    const row = await this.prisma.product.findFirst({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findBySku(sku: string): Promise<ProductEntity | null> {
    const row = await this.prisma.product.findFirst({ where: { sku } });
    return row ? this.toEntity(row) : null;
  }

  async existsBySku(sku: string): Promise<boolean> {
    return (await this.prisma.product.count({ where: { sku } })) > 0;
  }

  async update(id: string, data: UpdateProductData): Promise<ProductEntity> {
    const row = await this.prisma.product.update({
      where: { id },
      data,
    });
    return this.toEntity(row);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private toEntity(row: Product): ProductEntity {
    return {
      id: row.id,
      sku: row.sku,
      name: row.name,
      description: row.description,
      price: Number(row.price),
      cost: row.cost === null ? null : Number(row.cost),
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
  }
}
