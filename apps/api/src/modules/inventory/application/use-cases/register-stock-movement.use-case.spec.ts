import { BadRequestException } from '@nestjs/common';
import { StockMovementType } from '@prisma/client';
import { RegisterStockMovementUseCase } from './register-stock-movement.use-case';
import type { IInventoryRepository } from '../../domain/repositories/inventory.repository';

describe('RegisterStockMovementUseCase', () => {
  let repo: jest.Mocked<
    Pick<
      IInventoryRepository,
      'findByBranchAndProduct' | 'registerMovement'
    >
  >;
  let audit: { execute: jest.Mock };
  let useCase: RegisterStockMovementUseCase;

  beforeEach(() => {
    repo = {
      findByBranchAndProduct: jest.fn().mockResolvedValue(null),
      registerMovement: jest.fn().mockResolvedValue({} as any),
    };
    audit = { execute: jest.fn().mockResolvedValue(undefined) };
    useCase = new RegisterStockMovementUseCase(
      repo as unknown as IInventoryRepository,
      audit as never,
    );
  });

  it('rejects a SALE that exceeds current stock', async () => {
    repo.findByBranchAndProduct.mockResolvedValue({
      id: 'i1',
      branchId: 'b1',
      productId: 'p1',
      quantity: 5,
      lowStockThreshold: 2,
      updatedAt: new Date(),
    });

    await expect(
      useCase.execute(
        {
          productId: 'p1',
          type: StockMovementType.SALE,
          quantity: 10,
        },
        'b1',
        'u1',
      ),
    ).rejects.toThrow(BadRequestException);
    expect(repo.registerMovement).not.toHaveBeenCalled();
  });

  it('records a PURCHASE and normalizes quantity as positive', async () => {
    repo.findByBranchAndProduct.mockResolvedValue({
      id: 'i1',
      branchId: 'b1',
      productId: 'p1',
      quantity: 5,
      lowStockThreshold: 2,
      updatedAt: new Date(),
    });

    await useCase.execute(
      {
        productId: 'p1',
        type: StockMovementType.PURCHASE,
        quantity: 10,
        reference: 'Factura #102',
      },
      'b1',
      'u1',
    );

    expect(repo.registerMovement).toHaveBeenCalledWith({
      branchId: 'b1',
      productId: 'p1',
      type: StockMovementType.PURCHASE,
      quantity: 10,
      reference: 'Factura #102',
      createdById: 'u1',
    });
  });

  it('allows an ADJUSTMENT even if it leads to negative stock', async () => {
    repo.findByBranchAndProduct.mockResolvedValue({
      id: 'i1',
      branchId: 'b1',
      productId: 'p1',
      quantity: 2,
      lowStockThreshold: 2,
      updatedAt: new Date(),
    });

    await useCase.execute(
      {
        productId: 'p1',
        type: StockMovementType.ADJUSTMENT,
        quantity: -5,
        reference: 'Ajuste de inventario físico',
      },
      'b1',
      'u1',
    );

    expect(repo.registerMovement).toHaveBeenCalledWith({
      branchId: 'b1',
      productId: 'p1',
      type: StockMovementType.ADJUSTMENT,
      quantity: -5,
      reference: 'Ajuste de inventario físico',
      createdById: 'u1',
    });
    expect(audit.execute).toHaveBeenCalledWith({
      userId: 'u1',
      branchId: 'b1',
      action: 'STOCK_ADJUSTED',
      entityType: 'Product',
      entityId: 'p1',
      metadata: { quantity: -5, reference: 'Ajuste de inventario físico' },
    });
  });

  it('no audita movimientos que no son ajuste', async () => {
    await useCase.execute(
      {
        productId: 'p1',
        branchId: 'b1',
        type: StockMovementType.PURCHASE,
        quantity: 5,
      },
      'b1',
      'u1',
    );
    expect(audit.execute).not.toHaveBeenCalled();
  });
});
