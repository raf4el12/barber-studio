import { Module } from '@nestjs/common';
import { CASH_REGISTER_REPOSITORY } from '../domain/repositories/cash-register.repository';
import { PrismaCashRegisterRepository } from '../infrastructure/persistence/prisma-cash-register.repository';
import { CashRegistersController } from '../interfaces/controllers/cash-registers.controller';
import { OpenCashRegisterUseCase } from './use-cases/open-cash-register.use-case';
import { CloseCashRegisterUseCase } from './use-cases/close-cash-register.use-case';
import { GetActiveCashRegisterUseCase } from './use-cases/get-active-cash-register.use-case';
import { ListCashRegistersUseCase } from './use-cases/list-cash-registers.use-case';

@Module({
  controllers: [CashRegistersController],
  providers: [
    {
      provide: CASH_REGISTER_REPOSITORY,
      useClass: PrismaCashRegisterRepository,
    },
    OpenCashRegisterUseCase,
    CloseCashRegisterUseCase,
    GetActiveCashRegisterUseCase,
    ListCashRegistersUseCase,
  ],
  exports: [CASH_REGISTER_REPOSITORY],
})
export class CashRegistersModule {}
