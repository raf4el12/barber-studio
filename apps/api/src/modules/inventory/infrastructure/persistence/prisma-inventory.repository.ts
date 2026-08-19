import { Inject, Injectable } from '@nestjs/common';
import type { Inventory, Product } from '@prisma/client';
import {
  EXTENDED_PRISMA,
  type ExtendedPrismaService,
} from '../../../../prisma/prisma.service';
import type { IInventoryRepository } from '../../domain/repositories/inventory.repository';
import type {
  RegisterStockMovementData,
  MovementResult,
} from '../../domain/interfaces/inventory-data.interface';
import { InventoryEntity } from '../../domain/entities/inventory.entity';

type InventoryWithProduct = Inventory & {
  product?: Product | null;
};

@Injectable()
export class PrismaInventoryRepository implements IInventoryRepository {
  constructor(
    @Inject(EXTENDED_PRISMA) private readonly prisma: ExtendedPrismaService,
  ) {}

  async findByBranchAndProduct(
    branchId: string,
    productId: string,
  ): Promise<InventoryEntity | null> {
    const row = await this.prisma.inventory.findUnique({
      where: {
        branchId_productId: { branchId, productId },
      },
      include: { product: true },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAllByBranch(branchId: string): Promise<InventoryEntity[]> {
    const rows = await this.prisma.inventory.findMany({
      where: { branchId },
      include: { product: true },
      orderBy: { product: { name: 'asc' } },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findLowStock(branchId: string): Promise<InventoryEntity[]> {
    const rows = await this.prisma.inventory.findMany({
      where: { branchId },
      include: { product: true },
    });
    return rows
      .filter((r) => r.quantity <= r.lowStockThreshold)
      .map((r) => this.toEntity(r));
  }

  async registerMovement(
    data: RegisterStockMovementData,
  ): Promise<MovementResult> {
    return this.prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          branchId: data.branchId,
          productId: data.productId,
          type: data.type,
          quantity: data.quantity,
          reference: data.reference,
          createdById: data.createdById,
        },
      });

      const inventory = await tx.inventory.upsert({
        where: {
          branchId_productId: {
            branchId: data.branchId,
            productId: data.productId,
          },
        },
        create: {
          branchId: data.branchId,
          productId: data.productId,
          quantity: data.quantity,
          lowStockThreshold: 0,
        },
        update: {
          quantity: {
            increment: data.quantity,
          },
        },
      });

      return {
        inventory: {
          id: inventory.id,
          branchId: inventory.branchId,
          productId: inventory.productId,
          quantity: inventory.quantity,
          lowStockThreshold: inventory.lowStockThreshold,
          updatedAt: inventory.updatedAt,
        },
        movement: {
          id: movement.id,
          branchId: movement.branchId,
          productId: movement.productId,
          type: movement.type,
          quantity: movement.quantity,
          reference: movement.reference,
          createdById: movement.createdById,
          createdAt: movement.createdAt,
        },
      };
    });
  }

  async updateThreshold(
    branchId: string,
    productId: string,
    lowStockThreshold: number,
  ): Promise<InventoryEntity> {
    const row = await this.prisma.inventory.upsert({
      where: {
        branchId_productId: { branchId, productId },
      },
      create: {
        branchId,
        productId,
        quantity: 0,
        lowStockThreshold,
      },
      update: {
        lowStockThreshold,
      },
      include: { product: true },
    });
    return this.toEntity(row);
  }

  private toEntity(row: InventoryWithProduct): InventoryEntity {
    return {
      id: row.id,
      branchId: row.branchId,
      productId: row.productId,
      quantity: row.quantity,
      lowStockThreshold: row.lowStockThreshold,
      updatedAt: row.updatedAt,
      product: row.product
        ? {
            id: row.product.id,
            sku: row.product.sku,
            name: row.product.name,
            description: row.product.description,
            price: Number(row.product.price),
            cost: row.product.cost === null ? null : Number(row.product.cost),
            isActive: row.product.isActive,
            createdAt: row.product.createdAt,
            updatedAt: row.product.updatedAt,
            deletedAt: row.product.deletedAt,
          }
        : undefined,
    };
  }
}
