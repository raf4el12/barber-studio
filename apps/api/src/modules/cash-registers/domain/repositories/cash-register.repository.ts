import type { CashRegisterEntity } from '../entities/cash-register.entity';
import type { OpenCashRegisterData } from '../interfaces/cash-register-data.interface';

export const CASH_REGISTER_REPOSITORY = 'ICashRegisterRepository';

export interface ICashRegisterRepository {
  open(data: OpenCashRegisterData): Promise<CashRegisterEntity>;
  findActive(branchId: string): Promise<CashRegisterEntity | null>;
  findById(id: string): Promise<CashRegisterEntity | null>;
  findByBranch(branchId: string): Promise<CashRegisterEntity[]>;
  close(
    id: string,
    data: {
      closedById: string;
      closingCountedCash: number;
      notes?: string | null;
    },
  ): Promise<CashRegisterEntity>;
}
