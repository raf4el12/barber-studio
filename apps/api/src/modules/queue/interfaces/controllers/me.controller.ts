import { Controller, ForbiddenException, Get, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  CurrentUser,
  type AuthUser,
} from '../../../../common/decorators/current-user.decorator';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { GetMyPerformanceUseCase } from '../../application/use-cases/get-my-performance.use-case';

@Controller('me')
export class MeController {
  constructor(private readonly performance: GetMyPerformanceUseCase) {}

  @Get('performance')
  @Roles(Role.BARBER)
  getPerformance(
    @CurrentUser() user: AuthUser,
    @Query('branchId') queryBranchId?: string,
  ) {
    if (queryBranchId && user.branchId && queryBranchId !== user.branchId) {
      throw new ForbiddenException('Solo puedes ver tu propio rendimiento');
    }
    return this.performance.execute(
      user.id,
      queryBranchId ?? user.branchId ?? undefined,
    );
  }
}
