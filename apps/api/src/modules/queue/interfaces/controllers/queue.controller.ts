import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { QueueStatus, Role } from '@prisma/client';
import { UseGuards } from '@nestjs/common';
import { BranchScopeGuard } from '../../../../common/guards/branch-scope.guard';
import {
  CurrentUser,
  type AuthUser,
} from '../../../../common/decorators/current-user.decorator';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CreateQueueEntryDto } from '../../application/dto/create-queue-entry.dto';
import { AssignBarberDto } from '../../application/dto/assign-barber.dto';
import { ChangeQueueStatusDto } from '../../application/dto/change-queue-status.dto';
import { CreateQueueEntryUseCase } from '../../application/use-cases/create-queue-entry.use-case';
import { ListQueueUseCase } from '../../application/use-cases/list-queue.use-case';
import { AssignBarberUseCase } from '../../application/use-cases/assign-barber.use-case';
import { ChangeQueueStatusUseCase } from '../../application/use-cases/change-queue-status.use-case';

function scopedBranch(user: AuthUser, queryBranchId?: string): string {
  return user.role === Role.OWNER && queryBranchId
    ? queryBranchId
    : (user.branchId ?? queryBranchId ?? '');
}

@Controller('queue')
@Roles(Role.OWNER, Role.CASHIER, Role.BARBER)
@UseGuards(BranchScopeGuard)
export class QueueController {
  constructor(
    private readonly createEntry: CreateQueueEntryUseCase,
    private readonly listQueue: ListQueueUseCase,
    private readonly assignBarber: AssignBarberUseCase,
    private readonly changeQueueStatus: ChangeQueueStatusUseCase,
  ) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('branchId') queryBranchId?: string,
    @Query('status') status?: QueueStatus,
    @Query('assignedBarberId') assignedBarberId?: string,
  ) {
    return this.listQueue.execute(
      scopedBranch(user, queryBranchId),
      status,
      assignedBarberId,
    );
  }

  @Post()
  create(@Body() dto: CreateQueueEntryDto, @CurrentUser() user: AuthUser) {
    const branchId =
      user.role === Role.OWNER && dto.branchId
        ? dto.branchId
        : (user.branchId ?? dto.branchId ?? '');
    return this.createEntry.execute(dto, branchId);
  }

  @Patch(':id/assign')
  assign(
    @Param('id') id: string,
    @Body() dto: AssignBarberDto,
    @CurrentUser() user: AuthUser,
  ) {
    const scope = user.role === Role.OWNER ? undefined : (user.branchId ?? '');
    return this.assignBarber.execute(id, dto.barberId, scope);
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeQueueStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    const scope = user.role === Role.OWNER ? undefined : (user.branchId ?? '');
    return this.changeQueueStatus.execute(id, dto.status, scope);
  }
}
