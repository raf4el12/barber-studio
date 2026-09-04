import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  COMMISSION_RULE_REPOSITORY,
  type ICommissionRuleRepository,
} from '../../domain/repositories/commission-rule.repository';

@Injectable()
export class DeleteCommissionRuleUseCase {
  constructor(
    @Inject(COMMISSION_RULE_REPOSITORY)
    private readonly rules: ICommissionRuleRepository,
  ) {}

  async execute(id: string) {
    const rule = await this.rules.findById(id);
    if (!rule) {
      throw new NotFoundException(`Regla de comisión no encontrada: ${id}`);
    }
    await this.rules.delete(id);
  }
}
