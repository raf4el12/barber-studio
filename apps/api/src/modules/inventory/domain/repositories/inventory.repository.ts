import type { InventoryEntity } from '../entities/inventory.entity';
import type {
  RegisterStockMovementData,
  MovementResult,
} from '../interfaces/inventory-data.interface';

export const INVENTORY_REPOSITORY = 'IInventoryRepository';

export interface IInventoryRepository {
  findByBranchAndProduct(
    branchId: string,
    productId: string,
  ): Promise<InventoryEntity | null>;
  findAllByBranch(branchId: string): Promise<InventoryEntity[]>;
  findLowStock(branchId: string): Promise<InventoryEntity[]>;
  registerMovement(data: RegisterStockMovementData): Promise<MovementResult>;
  updateThreshold(
    branchId: string,
    productId: string,
    lowStockThreshold: number,
  ): Promise<InventoryEntity>;
}
