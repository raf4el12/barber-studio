import { Inject, Injectable } from '@nestjs/common';
import {
  CASH_REGISTER_REPOSITORY,
  type ICashRegisterRepository,
} from '../../domain/repositories/cash-register.repository';

@Injectable()
export class ListCashRegistersUseCase {
  constructor(
    @Inject(CASH_REGISTER_REPOSITORY)
    private readonly registers: ICashRegisterRepository,
  ) {}

  execute(branchId: string) {
    return this.registers.findByBranch(branchId);
  }
}
