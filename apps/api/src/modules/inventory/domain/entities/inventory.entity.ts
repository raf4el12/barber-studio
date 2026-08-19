import { ProductEntity } from '../../../products/domain/entities/product.entity';

export class InventoryEntity {
  id!: string;
  branchId!: string;
  productId!: string;
  quantity!: number;
  lowStockThreshold!: number;
  updatedAt!: Date;
  product?: ProductEntity;
}
