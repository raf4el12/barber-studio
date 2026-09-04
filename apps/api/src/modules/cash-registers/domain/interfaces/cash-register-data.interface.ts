export interface OpenCashRegisterData {
  branchId: string;
  openedById: string;
  openingAmount: number;
  notes?: string | null;
}

export interface CloseCashRegisterData {
  closedById: string;
  closingCountedCash: number;
  notes?: string | null;
}
