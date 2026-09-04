import { QueueStatus } from '@prisma/client';

const ALLOWED: Record<QueueStatus, QueueStatus[]> = {
  [QueueStatus.WAITING]: [QueueStatus.IN_PROGRESS, QueueStatus.CANCELLED],
  [QueueStatus.IN_PROGRESS]: [QueueStatus.COMPLETED, QueueStatus.CANCELLED],
  [QueueStatus.COMPLETED]: [],
  [QueueStatus.CANCELLED]: [],
};

/** Política pura de ciclo de vida de la entrada de cola (sin framework). */
export function canTransition(from: QueueStatus, to: QueueStatus): boolean {
  return ALLOWED[from].includes(to);
}
