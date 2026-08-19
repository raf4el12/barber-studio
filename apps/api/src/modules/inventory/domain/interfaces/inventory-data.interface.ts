import { StockMovementType } from '@prisma/client';

export interface RegisterStockMovementData {
  branchId: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  reference?: string;
  createdById?: string;
}

export interface MovementResult {
  inventory: {
    id: string;
    branchId: string;
    productId: string;
    quantity: number;
    lowStockThreshold: number;
    updatedAt: Date;
  };
  movement: {
    id: string;
    branchId: string;
    productId: string;
    type: StockMovementType;
    quantity: number;
    reference: string | null;
    createdById: string | null;
    createdAt: Date;
  };
}
