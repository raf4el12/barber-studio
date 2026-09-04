import type { CommissionRuleEntity } from '../../domain/entities/commission-rule.entity';

/** Snapshot compacto para el diff de auditoría (antes/después). */
export function ruleSnapshot(rule: CommissionRuleEntity) {
  return {
    type: rule.type,
    value: rule.value,
    priority: rule.priority,
    isActive: rule.isActive,
    barberId: rule.barberId,
    serviceId: rule.serviceId,
    serviceCategoryId: rule.serviceCategoryId,
    productId: rule.productId,
    branchId: rule.branchId,
    startsAt: rule.startsAt,
    endsAt: rule.endsAt,
  };
}
