import { Controller, ForbiddenException, Get, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  CurrentUser,
  type AuthUser,
} from '../../../../common/decorators/current-user.decorator';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { BuildZReportUseCase } from '../../application/use-cases/build-z-report.use-case';
import {
  GetBarberPayoutsUseCase,
  GetMetricsUseCase,
} from '../../application/use-cases/analytics.use-case';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly buildZReport: BuildZReportUseCase,
    private readonly barberPayouts: GetBarberPayoutsUseCase,
    private readonly metrics: GetMetricsUseCase,
  ) {}

  @Get('z-report')
  @Roles(Role.OWNER, Role.CASHIER)
  zReport(
    @CurrentUser() user: AuthUser,
    @Query('cashRegisterId') cashRegisterId?: string,
    @Query('branchId') queryBranchId?: string,
    @Query('date') date?: string,
  ) {
    if (!cashRegisterId && user.role !== Role.OWNER) {
      throw new ForbiddenException('El arqueo por día es solo para OWNER');
    }
    const branchId =
      user.role === Role.OWNER
        ? queryBranchId
        : (user.branchId ?? queryBranchId);
    return this.buildZReport.execute({ cashRegisterId, branchId, date });
  }

  @Get('barber-payouts')
  @Roles(Role.OWNER)
  payouts(
    @Query('branchId') branchId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.barberPayouts.execute({ branchId, from, to });
  }

  @Get('metrics')
  @Roles(Role.OWNER)
  getMetrics(
    @Query('branchId') branchId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.metrics.execute({ branchId, from, to });
  }
}
