import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  PAYMENT_METHOD_REPOSITORY,
  type IPaymentMethodRepository,
} from '../../domain/repositories/payment-method.repository';

@Injectable()
export class DeletePaymentMethodUseCase {
  constructor(
    @Inject(PAYMENT_METHOD_REPOSITORY)
    private readonly methods: IPaymentMethodRepository,
  ) {}

  /**
   * Sin pagos → baja física. Con pagos → se desactiva (isActive=false)
   * para no romper el historial, y se devuelve la entidad.
   */
  async execute(id: string) {
    const existing = await this.methods.findById(id);
    if (!existing) {
      throw new NotFoundException(`Método de pago no encontrado: ${id}`);
    }
    if (await this.methods.hasPayments(id)) {
      return this.methods.update(id, { isActive: false });
    }
    await this.methods.delete(id);
    return null;
  }
}
