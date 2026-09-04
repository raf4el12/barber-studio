import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  COMMISSION_RULE_REPOSITORY,
  type ICommissionRuleRepository,
} from '../../domain/repositories/commission-rule.repository';
import type { UpdateCommissionRuleData } from '../../domain/interfaces/commission-rule-data.interface';
import { UpdateCommissionRuleDto } from '../dto/update-commission-rule.dto';

@Injectable()
export class UpdateCommissionRuleUseCase {
  constructor(
    @Inject(COMMISSION_RULE_REPOSITORY)
    private readonly rules: ICommissionRuleRepository,
  ) {}

  async execute(id: string, dto: UpdateCommissionRuleDto) {
    const existing = await this.rules.findById(id);
    if (!existing) {
      throw new NotFoundException(`Regla de comisión no encontrada: ${id}`);
    }
    const data = this.normalize(dto);
    const startsAt =
      data.startsAt !== undefined ? data.startsAt : existing.startsAt;
    const endsAt = data.endsAt !== undefined ? data.endsAt : existing.endsAt;
    if (startsAt && endsAt && endsAt < startsAt) {
      throw new BadRequestException('endsAt debe ser posterior a startsAt');
    }
    const productId =
      data.productId !== undefined ? data.productId : existing.productId;
    const serviceId =
      data.serviceId !== undefined ? data.serviceId : existing.serviceId;
    const serviceCategoryId =
      data.serviceCategoryId !== undefined
        ? data.serviceCategoryId
        : existing.serviceCategoryId;
    if (
      productId !== null &&
      (serviceId !== null || serviceCategoryId !== null)
    ) {
      throw new BadRequestException(
        'Una regla de producto no puede combinarse con ámbito de servicio o categoría',
      );
    }
    return this.rules.update(id, data);
  }

  private normalize(dto: UpdateCommissionRuleDto): UpdateCommissionRuleData {
    const data: UpdateCommissionRuleData = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.value !== undefined) data.value = dto.value;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.barberId !== undefined) data.barberId = dto.barberId;
    if (dto.serviceId !== undefined) data.serviceId = dto.serviceId;
    if (dto.serviceCategoryId !== undefined)
      data.serviceCategoryId = dto.serviceCategoryId;
    if (dto.productId !== undefined) data.productId = dto.productId;
    if (dto.branchId !== undefined) data.branchId = dto.branchId;
    if (dto.startsAt !== undefined)
      data.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    if (dto.endsAt !== undefined)
      data.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    return data;
  }
}
