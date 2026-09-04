import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  PAYMENT_METHOD_REPOSITORY,
  type IPaymentMethodRepository,
} from '../../domain/repositories/payment-method.repository';
import { UpdatePaymentMethodDto } from '../dto/update-payment-method.dto';

@Injectable()
export class UpdatePaymentMethodUseCase {
  constructor(
    @Inject(PAYMENT_METHOD_REPOSITORY)
    private readonly methods: IPaymentMethodRepository,
  ) {}

  async execute(id: string, dto: UpdatePaymentMethodDto) {
    const existing = await this.methods.findById(id);
    if (!existing) {
      throw new NotFoundException(`Método de pago no encontrado: ${id}`);
    }
    return this.methods.update(id, {
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
    });
  }
}
