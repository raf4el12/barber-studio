import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  INVENTORY_REPOSITORY,
  type IInventoryRepository,
} from '../../domain/repositories/inventory.repository';
import { UpdateStockThresholdDto } from '../dto/update-stock-threshold.dto';

@Injectable()
export class UpdateStockThresholdUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventory: IInventoryRepository,
  ) {}

  execute(dto: UpdateStockThresholdDto, effectiveBranchId: string) {
    const branchId = dto.branchId ?? effectiveBranchId;
    if (!branchId) {
      throw new BadRequestException('Se requiere branchId');
    }
    return this.inventory.updateThreshold(
      branchId,
      dto.productId,
      dto.lowStockThreshold,
    );
  }
}
