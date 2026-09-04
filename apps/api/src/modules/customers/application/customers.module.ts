import { forwardRef, Module } from '@nestjs/common';
import { CUSTOMER_REPOSITORY } from '../domain/repositories/customer.repository';
import { PrismaCustomerRepository } from '../infrastructure/persistence/prisma-customer.repository';
import { CustomersController } from '../interfaces/controllers/customers.controller';
import { CreateCustomerUseCase } from './use-cases/create-customer.use-case';
import { FindAllCustomersUseCase } from './use-cases/find-all-customers.use-case';
import { FindOneCustomerUseCase } from './use-cases/find-one-customer.use-case';
import { UpdateCustomerUseCase } from './use-cases/update-customer.use-case';
import { DeleteCustomerUseCase } from './use-cases/delete-customer.use-case';
import {
  GetCustomerHistoryUseCase,
  GetCustomerLoyaltyUseCase,
} from './use-cases/customer-queries.use-case';
import {
  AccrueLoyaltyUseCase,
  RedeemLoyaltyUseCase,
} from './use-cases/loyalty.use-case';
import { SettingsModule } from '../../settings/application/settings.module';
import { TicketsModule } from '../../tickets/application/tickets.module';

@Module({
  imports: [SettingsModule, forwardRef(() => TicketsModule)],
  controllers: [CustomersController],
  providers: [
    { provide: CUSTOMER_REPOSITORY, useClass: PrismaCustomerRepository },
    CreateCustomerUseCase,
    FindAllCustomersUseCase,
    FindOneCustomerUseCase,
    UpdateCustomerUseCase,
    DeleteCustomerUseCase,
    GetCustomerHistoryUseCase,
    GetCustomerLoyaltyUseCase,
    AccrueLoyaltyUseCase,
    RedeemLoyaltyUseCase,
  ],
  exports: [CUSTOMER_REPOSITORY, AccrueLoyaltyUseCase],
})
export class CustomersModule {}
