import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  COMMISSION_RULE_REPOSITORY,
  type ICommissionRuleRepository,
} from '../../domain/repositories/commission-rule.repository';
import type { CreateCommissionRuleData } from '../../domain/interfaces/commission-rule-data.interface';
import { CreateCommissionRuleDto } from '../dto/create-commission-rule.dto';

@Injectable()
export class CreateCommissionRuleUseCase {
  constructor(
    @Inject(COMMISSION_RULE_REPOSITORY)
    private readonly rules: ICommissionRuleRepository,
  ) {}

  async execute(dto: CreateCommissionRuleDto) {
    const data = this.normalize(dto);
    this.assertValidScope(data);
    this.assertValidRange(data.startsAt, data.endsAt);
    return this.rules.create(data);
  }

  private normalize(dto: CreateCommissionRuleDto): CreateCommissionRuleData {
    return {
      name: dto.name ?? null,
      priority: dto.priority ?? 0,
      type: dto.type,
      value: dto.value,
      isActive: dto.isActive ?? true,
      barberId: dto.barberId ?? null,
      serviceId: dto.serviceId ?? null,
      serviceCategoryId: dto.serviceCategoryId ?? null,
      productId: dto.productId ?? null,
      branchId: dto.branchId ?? null,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
    };
  }

  assertValidScope(
    data: Pick<
      CreateCommissionRuleData,
      'productId' | 'serviceId' | 'serviceCategoryId'
    >,
  ) {
    if (
      data.productId !== null &&
      (data.serviceId !== null || data.serviceCategoryId !== null)
    ) {
      throw new BadRequestException(
        'Una regla de producto no puede combinarse con ámbito de servicio o categoría',
      );
    }
  }

  assertValidRange(startsAt: Date | null, endsAt: Date | null) {
    if (startsAt && endsAt && endsAt < startsAt) {
      throw new BadRequestException('endsAt debe ser posterior a startsAt');
    }
  }
}
