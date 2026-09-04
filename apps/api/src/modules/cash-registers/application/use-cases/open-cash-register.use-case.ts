import {
  BadRequestException,
  Inject,
  Injectable,
  ConflictException,
} from '@nestjs/common';
import {
  CASH_REGISTER_REPOSITORY,
  type ICashRegisterRepository,
} from '../../domain/repositories/cash-register.repository';
import { OpenCashRegisterDto } from '../dto/open-cash-register.dto';

@Injectable()
export class OpenCashRegisterUseCase {
  constructor(
    @Inject(CASH_REGISTER_REPOSITORY)
    private readonly registers: ICashRegisterRepository,
  ) {}

  async execute(
    dto: OpenCashRegisterDto,
    effectiveBranchId: string,
    userId: string,
  ) {
    const branchId = dto.branchId ?? effectiveBranchId;
    if (!branchId) {
      throw new BadRequestException(
        'Se requiere especificar la sucursal (branchId)',
      );
    }
    if (await this.registers.findActive(branchId)) {
      throw new ConflictException('Ya hay una caja abierta en esta sucursal');
    }
    return this.registers.open({
      branchId,
      openedById: userId,
      openingAmount: dto.openingAmount,
      notes: dto.notes ?? null,
    });
  }
}
