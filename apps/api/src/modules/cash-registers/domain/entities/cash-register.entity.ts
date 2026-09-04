export class CashRegisterEntity {
  id!: string;
  branchId!: string;
  openedById!: string;
  openingAmount!: number;
  openedAt!: Date;
  closedById!: string | null;
  closingCountedCash!: number | null;
  closedAt!: Date | null;
  notes!: string | null;
}
