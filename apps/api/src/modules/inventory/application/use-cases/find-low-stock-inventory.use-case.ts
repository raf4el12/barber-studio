import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  INVENTORY_REPOSITORY,
  type IInventoryRepository,
} from '../../domain/repositories/inventory.repository';

@Injectable()
export class FindLowStockInventoryUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventory: IInventoryRepository,
  ) {}

  execute(branchId: string) {
    if (!branchId) {
      throw new BadRequestException('Se requiere branchId');
    }
    return this.inventory.findLowStock(branchId);
  }
}
