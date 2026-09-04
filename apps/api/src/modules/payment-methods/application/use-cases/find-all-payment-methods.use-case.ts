import { Inject, Injectable } from '@nestjs/common';
import {
  PAYMENT_METHOD_REPOSITORY,
  type IPaymentMethodRepository,
} from '../../domain/repositories/payment-method.repository';

@Injectable()
export class FindAllPaymentMethodsUseCase {
  constructor(
    @Inject(PAYMENT_METHOD_REPOSITORY)
    private readonly methods: IPaymentMethodRepository,
  ) {}

  execute(isActive?: boolean) {
    return this.methods.findAll(isActive);
  }
}
