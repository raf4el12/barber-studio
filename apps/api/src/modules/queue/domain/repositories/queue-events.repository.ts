export const QUEUE_EVENTS = 'IQueueEvents';

/**
 * Puerto de salida para notificar cambios de cola.
 * El adapter (QueueGateway) carga las entradas vigentes y emite
 * `queue.updated` a la room `branch:{branchId}`.
 */
export interface IQueueEvents {
  emitQueueUpdated(branchId: string): Promise<void>;
}
