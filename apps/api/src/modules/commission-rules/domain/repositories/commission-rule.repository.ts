import type { CommissionRuleEntity } from '../entities/commission-rule.entity';
import type {
  CreateCommissionRuleData,
  UpdateCommissionRuleData,
} from '../interfaces/commission-rule-data.interface';

export const COMMISSION_RULE_REPOSITORY = 'ICommissionRuleRepository';

export interface ICommissionRuleRepository {
  create(data: CreateCommissionRuleData): Promise<CommissionRuleEntity>;
  findAll(): Promise<CommissionRuleEntity[]>;
  findById(id: string): Promise<CommissionRuleEntity | null>;
  update(
    id: string,
    data: UpdateCommissionRuleData,
  ): Promise<CommissionRuleEntity>;
  /** Baja física: CommissionRule no tiene deletedAt y los snapshots históricos viven en TicketItem. */
  delete(id: string): Promise<void>;
}
