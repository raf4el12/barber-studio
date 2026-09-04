import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CUSTOMER_REPOSITORY,
  type ICustomerRepository,
} from '../../domain/repositories/customer.repository';
import { GetSettingUseCase } from '../../../settings/application/use-cases/get-setting.use-case';

export const LOYALTY_POINTS_PER_CURRENCY_KEY = 'loyalty_points_per_currency';

export interface AccrueLoyaltyInput {
  customerId: string;
  /** Total del ticket pagado (sin propina). */
  total: number;
  ticketId: string;
  ticketCode: string;
  branchId?: string;
}

@Injectable()
export class AccrueLoyaltyUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customers: ICustomerRepository,
    private readonly getSetting: GetSettingUseCase,
  ) {}

  /**
   * Acumula floor(total / factor). Nunca rompe el pago: sin cliente,
   * sin setting o con factor inválido se omite (devuelve null).
   */
  async execute(input: AccrueLoyaltyInput) {
    const customer = await this.customers.findById(input.customerId);
    if (!customer) return null;
    let factor: number;
    try {
      const setting = await this.getSetting.execute(
        LOYALTY_POINTS_PER_CURRENCY_KEY,
        input.branchId,
      );
      factor = Number(setting.value);
    } catch {
      return null;
    }
    if (!Number.isFinite(factor) || factor <= 0) return null;
    const points = Math.floor(input.total / factor);
    if (points <= 0) return null;
    const { transaction } = await this.customers.addTransaction({
      customerId: input.customerId,
      points,
      reason: `Ticket ${input.ticketCode} pagado`,
      ticketId: input.ticketId,
    });
    return transaction;
  }
}

@Injectable()
export class RedeemLoyaltyUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customers: ICustomerRepository,
  ) {}

  async execute(customerId: string, points: number, reason: string) {
    if (!Number.isInteger(points) || points <= 0) {
      throw new BadRequestException(
        'Los puntos a canjear deben ser un entero mayor a cero',
      );
    }
    if (!reason?.trim()) {
      throw new BadRequestException('El motivo del canje es obligatorio');
    }
    const customer = await this.customers.findById(customerId);
    if (!customer) {
      throw new NotFoundException(`Cliente no encontrado: ${customerId}`);
    }
    const balance = await this.customers.getBalance(customerId);
    if (points > balance) {
      throw new BadRequestException(
        `Saldo insuficiente: disponible ${balance}`,
      );
    }
    const { transaction } = await this.customers.addTransaction({
      customerId,
      points: -points,
      reason: reason.trim(),
      ticketId: null,
    });
    return transaction;
  }
}
