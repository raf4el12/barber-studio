export const SHIFT_REPOSITORY = 'IShiftRepository';

export interface OpenRegister {
  id: string;
  openedAt: Date;
}

/**
 * Puerto mínimo para delimitar el turno vigente.
 * Hoy lo implementa Prisma sobre CashRegister; la Fase 4 (caja)
 * puede reutilizarlo sin tocar la cola.
 */
export interface IShiftRepository {
  findOpenRegister(branchId: string): Promise<OpenRegister | null>;
}
