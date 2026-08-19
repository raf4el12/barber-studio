import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { StockMovementType } from '@prisma/client';
import {
  INVENTORY_REPOSITORY,
  type IInventoryRepository,
} from '../../domain/repositories/inventory.repository';
import { RegisterStockMovementDto } from '../dto/register-stock-movement.dto';

@Injectable()
export class RegisterStockMovementUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventory: IInventoryRepository,
  ) {}

  async execute(
    dto: RegisterStockMovementDto,
    effectiveBranchId: string,
    userId?: string,
  ) {
    const branchId = dto.branchId ?? effectiveBranchId;
    if (!branchId) {
      throw new BadRequestException('Se requiere especificar la sucursal (branchId)');
    }

    // Normalizar signo según el tipo de movimiento
    let normalizedQuantity = dto.quantity;
    switch (dto.type) {
      case StockMovementType.PURCHASE:
      case StockMovementType.TRANSFER_IN:
      case StockMovementType.RETURN:
        normalizedQuantity = Math.abs(dto.quantity);
        break;
      case StockMovementType.SALE:
      case StockMovementType.TRANSFER_OUT:
        normalizedQuantity = -Math.abs(dto.quantity);
        break;
      case StockMovementType.ADJUSTMENT:
        normalizedQuantity = dto.quantity;
        break;
    }

    // Comprobar si dejaría stock negativo (salvo en ajuste explícito)
    if (dto.type !== StockMovementType.ADJUSTMENT) {
      const current = await this.inventory.findByBranchAndProduct(
        branchId,
        dto.productId,
      );
      const currentQty = current?.quantity ?? 0;
      if (currentQty + normalizedQuantity < 0) {
        throw new BadRequestException(
          `Stock insuficiente. Existencias actuales: ${currentQty}, requeridas: ${Math.abs(normalizedQuantity)}`,
        );
      }
    }

    return this.inventory.registerMovement({
      branchId,
      productId: dto.productId,
      type: dto.type,
      quantity: normalizedQuantity,
      reference: dto.reference,
      createdById: userId,
    });
  }
}
