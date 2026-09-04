import { Inject, Injectable, ConflictException } from '@nestjs/common';
import {
  PAYMENT_METHOD_REPOSITORY,
  type IPaymentMethodRepository,
} from '../../domain/repositories/payment-method.repository';
import { CreatePaymentMethodDto } from '../dto/create-payment-method.dto';

@Injectable()
export class CreatePaymentMethodUseCase {
  constructor(
    @Inject(PAYMENT_METHOD_REPOSITORY)
    private readonly methods: IPaymentMethodRepository,
  ) {}

  async execute(dto: CreatePaymentMethodDto) {
    const code = dto.code.trim().toUpperCase();
    if (await this.methods.findByCode(code)) {
      throw new ConflictException(
        `Ya existe un método de pago con código ${code}`,
      );
    }
    return this.methods.create({
      code,
      name: dto.name.trim(),
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });
  }
}
