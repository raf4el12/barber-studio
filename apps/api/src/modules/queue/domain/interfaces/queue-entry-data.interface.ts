import type { QueueStatus } from '@prisma/client';

export interface CreateQueueEntryData {
  branchId: string;
  position?: number | null;
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  assignedBarberId?: string | null;
}

export interface QueueEntryFilters {
  branchId: string;
  status?: QueueStatus | QueueStatus[];
  assignedBarberId?: string;
}
