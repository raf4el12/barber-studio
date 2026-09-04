import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  COMMISSION_RULE_REPOSITORY,
  type ICommissionRuleRepository,
} from '../../domain/repositories/commission-rule.repository';
import { WriteAuditLogUseCase } from '../../../audit/application/use-cases/write-audit-log.use-case';
import { AuditAction } from '../../../audit/domain/constants/audit-actions';
import { ruleSnapshot } from './commission-rule-audit';

@Injectable()
export class DeleteCommissionRuleUseCase {
  constructor(
    @Inject(COMMISSION_RULE_REPOSITORY)
    private readonly rules: ICommissionRuleRepository,
    private readonly audit: WriteAuditLogUseCase,
  ) {}

  async execute(id: string, userId?: string) {
    const rule = await this.rules.findById(id);
    if (!rule) {
      throw new NotFoundException(`Regla de comisión no encontrada: ${id}`);
    }
    await this.rules.delete(id);
    await this.audit.execute({
      userId,
      branchId: rule.branchId,
      action: AuditAction.COMMISSION_RULE_CHANGED,
      entityType: 'CommissionRule',
      entityId: id,
      metadata: { operation: 'delete', before: ruleSnapshot(rule) },
    });
  }
}
