import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CASH_REGISTER_REPOSITORY,
  type ICashRegisterRepository,
} from '../../domain/repositories/cash-register.repository';
import { CloseCashRegisterDto } from '../dto/close-cash-register.dto';

@Injectable()
export class CloseCashRegisterUseCase {
  constructor(
    @Inject(CASH_REGISTER_REPOSITORY)
    private readonly registers: ICashRegisterRepository,
  ) {}

  async execute(
    id: string,
    dto: CloseCashRegisterDto,
    userId: string,
    scopeBranchId?: string,
  ) {
    const current = await this.registers.findById(id);
    if (!current) {
      throw new NotFoundException(`Caja no encontrada: ${id}`);
    }
    if (scopeBranchId && current.branchId !== scopeBranchId) {
      throw new ForbiddenException('La caja pertenece a otra sucursal');
    }
    if (current.closedAt) {
      throw new BadRequestException('La caja ya está cerrada');
    }
    return this.registers.close(id, {
      closedById: userId,
      closingCountedCash: dto.closingCountedCash,
      notes: dto.notes ?? current.notes,
    });
  }
}
