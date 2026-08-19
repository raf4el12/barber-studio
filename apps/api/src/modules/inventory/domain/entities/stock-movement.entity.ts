import { StockMovementType } from '@prisma/client';

export class StockMovementEntity {
  id!: string;
  branchId!: string;
  productId!: string;
  type!: StockMovementType;
  quantity!: number;
  reference!: string | null;
  createdById!: string | null;
  createdAt!: Date;
}
