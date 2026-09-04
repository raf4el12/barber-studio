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
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../users/domain/repositories/user.repository';
import {
  SERVICE_REPOSITORY,
  type IServiceRepository,
} from '../../../services/domain/repositories/service.repository';
import { GetSettingUseCase } from '../../../settings/application/use-cases/get-setting.use-case';
import { CommissionResolverService } from '../services/commission-resolver.service';
import { PreviewCommissionDto } from '../dto/preview-commission.dto';

export const COMMISSION_BASE_PERCENTAGE_KEY = 'commission_base_percentage';

@Injectable()
export class PreviewCommissionUseCase {
  constructor(
    @Inject(COMMISSION_RULE_REPOSITORY)
    private readonly rules: ICommissionRuleRepository,
    @Inject(USER_REPOSITORY)
    private readonly users: IUserRepository,
    @Inject(SERVICE_REPOSITORY)
    private readonly services: IServiceRepository,
    private readonly getSetting: GetSettingUseCase,
    private readonly resolver: CommissionResolverService,
  ) {}

  async execute(dto: PreviewCommissionDto) {
    const barber = await this.users.findById(dto.barberId);
    if (!barber) {
      throw new NotFoundException(`Barbero no encontrado: ${dto.barberId}`);
    }
    const branchId = dto.branchId ?? barber.branchId ?? null;

    let serviceCategoryId: string | null = null;
    if (dto.serviceId) {
      const service = await this.services.findById(dto.serviceId);
      if (!service) {
        throw new NotFoundException(`Servicio no encontrado: ${dto.serviceId}`);
      }
      serviceCategoryId = service.categoryId;
    }

    const setting = await this.getSetting.execute(
      COMMISSION_BASE_PERCENTAGE_KEY,
      branchId ?? undefined,
    );
    const basePercentage = Number(setting.value);
    if (Number.isNaN(basePercentage)) {
      throw new BadRequestException(
        `El setting ${COMMISSION_BASE_PERCENTAGE_KEY} no es numérico: ${setting.value}`,
      );
    }

    const rules = await this.rules.findAll();
    return this.resolver.resolve({
      rules,
      at: dto.at ? new Date(dto.at) : undefined,
      branchId,
      barberId: barber.id,
      serviceId: dto.serviceId ?? null,
      serviceCategoryId,
      productId: dto.productId ?? null,
      quantity: dto.quantity ?? 1,
      unitPrice: dto.unitPrice,
      barberCommissionRate: barber.commissionRate,
      basePercentage,
    });
  }
}
