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
import { WriteAuditLogUseCase } from '../../../audit/application/use-cases/write-audit-log.use-case';
import { AuditAction } from '../../../audit/domain/constants/audit-actions';

@Injectable()
export class CloseCashRegisterUseCase {
  constructor(
    @Inject(CASH_REGISTER_REPOSITORY)
    private readonly registers: ICashRegisterRepository,
    private readonly audit: WriteAuditLogUseCase,
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
    const closed = await this.registers.close(id, {
      closedById: userId,
      closingCountedCash: dto.closingCountedCash,
      notes: dto.notes ?? current.notes,
    });
    await this.audit.execute({
      userId,
      branchId: current.branchId,
      action: AuditAction.CASH_REGISTER_CLOSED,
      entityType: 'CashRegister',
      entityId: id,
      metadata: {
        openingAmount: current.openingAmount,
        closingCountedCash: dto.closingCountedCash,
      },
    });
    return closed;
  }
}
