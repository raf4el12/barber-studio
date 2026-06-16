import type { Role } from '@prisma/client';

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  branchId?: string;
}

export interface UpdateUserData {
  name?: string;
  passwordHash?: string;
  role?: Role;
  branchId?: string;
  isActive?: boolean;
}
