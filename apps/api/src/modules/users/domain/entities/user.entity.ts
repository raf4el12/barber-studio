import type { Role } from '@prisma/client';

// Forma pública del usuario: NUNCA incluye passwordHash.
// commissionRate se expone como número (la fila Prisma lo entrega como Decimal;
// el repositorio lo convierte en infraestructura).
export class UserEntity {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  branchId: string | null;
  commissionRate: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
