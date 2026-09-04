import type { QueueStatus } from '@prisma/client';

export class QueueEntryEntity {
  id!: string;
  branchId!: string;
  status!: QueueStatus;
  position!: number | null;
  customerId!: string | null;
  customerName!: string | null;
  customerPhone!: string | null;
  assignedBarberId!: string | null;
  createdAt!: Date;
  calledAt!: Date | null;
  closedAt!: Date | null;
}
