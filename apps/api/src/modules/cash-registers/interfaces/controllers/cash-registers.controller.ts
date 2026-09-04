import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  CurrentUser,
  type AuthUser,
} from '../../../../common/decorators/current-user.decorator';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { OpenCashRegisterDto } from '../../application/dto/open-cash-register.dto';
import { CloseCashRegisterDto } from '../../application/dto/close-cash-register.dto';
import { OpenCashRegisterUseCase } from '../../application/use-cases/open-cash-register.use-case';
import { CloseCashRegisterUseCase } from '../../application/use-cases/close-cash-register.use-case';
import { GetActiveCashRegisterUseCase } from '../../application/use-cases/get-active-cash-register.use-case';
import { ListCashRegistersUseCase } from '../../application/use-cases/list-cash-registers.use-case';

function scopedBranch(user: AuthUser, explicit?: string): string {
  return user.role === Role.OWNER && explicit
    ? explicit
    : (user.branchId ?? explicit ?? '');
}

@Controller('cash-registers')
@Roles(Role.OWNER, Role.CASHIER)
export class CashRegistersController {
  constructor(
    private readonly openRegister: OpenCashRegisterUseCase,
    private readonly closeRegister: CloseCashRegisterUseCase,
    private readonly getActive: GetActiveCashRegisterUseCase,
    private readonly listRegisters: ListCashRegistersUseCase,
  ) {}

  @Post('open')
  open(@Body() dto: OpenCashRegisterDto, @CurrentUser() user: AuthUser) {
    const branchId = scopedBranch(user, dto.branchId);
    return this.openRegister.execute({ ...dto, branchId }, branchId, user.id);
  }

  @Post(':id/close')
  close(
    @Param('id') id: string,
    @Body() dto: CloseCashRegisterDto,
    @CurrentUser() user: AuthUser,
  ) {
    const scope = user.role === Role.OWNER ? undefined : (user.branchId ?? '');
    return this.closeRegister.execute(id, dto, user.id, scope);
  }

  @Get('active')
  active(
    @CurrentUser() user: AuthUser,
    @Query('branchId') queryBranchId?: string,
  ) {
    return this.getActive.execute(scopedBranch(user, queryBranchId));
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('branchId') queryBranchId?: string,
  ) {
    return this.listRegisters.execute(scopedBranch(user, queryBranchId));
  }
}
