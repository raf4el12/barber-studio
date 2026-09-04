import { Module } from '@nestjs/common';
import { PAYMENT_METHOD_REPOSITORY } from '../domain/repositories/payment-method.repository';
import { PrismaPaymentMethodRepository } from '../infrastructure/persistence/prisma-payment-method.repository';
import { PaymentMethodsController } from '../interfaces/controllers/payment-methods.controller';
import { CreatePaymentMethodUseCase } from './use-cases/create-payment-method.use-case';
import { FindAllPaymentMethodsUseCase } from './use-cases/find-all-payment-methods.use-case';
import { UpdatePaymentMethodUseCase } from './use-cases/update-payment-method.use-case';
import { DeletePaymentMethodUseCase } from './use-cases/delete-payment-method.use-case';

@Module({
  controllers: [PaymentMethodsController],
  providers: [
    {
      provide: PAYMENT_METHOD_REPOSITORY,
      useClass: PrismaPaymentMethodRepository,
    },
    CreatePaymentMethodUseCase,
    FindAllPaymentMethodsUseCase,
    UpdatePaymentMethodUseCase,
    DeletePaymentMethodUseCase,
  ],
  exports: [PAYMENT_METHOD_REPOSITORY],
})
export class PaymentMethodsModule {}
