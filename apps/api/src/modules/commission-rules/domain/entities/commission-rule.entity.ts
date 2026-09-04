import type { CommissionType } from '@prisma/client';

export class CommissionRuleEntity {
  id!: string;
  name!: string | null;
  priority!: number;
  type!: CommissionType;
  value!: number;
  isActive!: boolean;
  barberId!: string | null;
  serviceId!: string | null;
  serviceCategoryId!: string | null;
  productId!: string | null;
  branchId!: string | null;
  startsAt!: Date | null;
  endsAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}
