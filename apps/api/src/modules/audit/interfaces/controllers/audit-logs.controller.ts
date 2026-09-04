import { Controller, Get, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { ListAuditLogsUseCase } from '../../application/use-cases/list-audit-logs.use-case';

function toNumber(value?: string): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

@Controller('audit-logs')
@Roles(Role.OWNER)
export class AuditLogsController {
  constructor(private readonly listLogs: ListAuditLogsUseCase) {}

  @Get()
  findAll(
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
    @Query('branchId') branchId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.listLogs.execute({
      action,
      entityType,
      entityId,
      userId,
      branchId,
      from,
      to,
      page: toNumber(page),
      limit: toNumber(limit),
    });
  }
}
