import type { CommissionType } from '@prisma/client';

export interface CreateCommissionRuleData {
  name?: string | null;
  priority: number;
  type: CommissionType;
  value: number;
  isActive: boolean;
  barberId: string | null;
  serviceId: string | null;
  serviceCategoryId: string | null;
  productId: string | null;
  branchId: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
}

export type UpdateCommissionRuleData = Partial<CreateCommissionRuleData>;
