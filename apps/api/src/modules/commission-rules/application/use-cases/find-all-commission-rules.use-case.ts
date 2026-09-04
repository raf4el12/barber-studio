import { Inject, Injectable } from '@nestjs/common';
import {
  COMMISSION_RULE_REPOSITORY,
  type ICommissionRuleRepository,
} from '../../domain/repositories/commission-rule.repository';

@Injectable()
export class FindAllCommissionRulesUseCase {
  constructor(
    @Inject(COMMISSION_RULE_REPOSITORY)
    private readonly rules: ICommissionRuleRepository,
  ) {}

  execute() {
    return this.rules.findAll();
  }
}
