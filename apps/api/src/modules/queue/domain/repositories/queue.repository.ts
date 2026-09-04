import type { QueueEntryEntity } from '../entities/queue-entry.entity';
import type {
  CreateQueueEntryData,
  QueueEntryFilters,
} from '../interfaces/queue-entry-data.interface';

export const QUEUE_REPOSITORY = 'IQueueRepository';

export interface IQueueRepository {
  create(data: CreateQueueEntryData): Promise<QueueEntryEntity>;
  findAll(filters: QueueEntryFilters): Promise<QueueEntryEntity[]>;
  findById(id: string): Promise<QueueEntryEntity | null>;
  assignBarber(id: string, barberId: string): Promise<QueueEntryEntity>;
  updateStatus(
    id: string,
    data: {
      status: QueueEntryEntity['status'];
      calledAt?: Date | null;
      closedAt?: Date | null;
    },
  ): Promise<QueueEntryEntity>;
  countCompletedByBarberSince(
    barberId: string,
    branchId: string,
    since: Date,
  ): Promise<number>;
}
