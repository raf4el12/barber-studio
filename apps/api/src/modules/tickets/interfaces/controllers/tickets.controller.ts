import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role, TicketStatus } from '@prisma/client';
import {
  CurrentUser,
  type AuthUser,
} from '../../../../common/decorators/current-user.decorator';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CreateTicketDto } from '../../application/dto/create-ticket.dto';
import { AddPaymentDto } from '../../application/dto/add-payment.dto';
import { ApplyDiscountDto } from '../../application/dto/apply-discount.dto';
import { CreateTicketUseCase } from '../../application/use-cases/create-ticket.use-case';
import { FindAllTicketsUseCase } from '../../application/use-cases/find-all-tickets.use-case';
import { FindOneTicketUseCase } from '../../application/use-cases/find-one-ticket.use-case';
import { AddPaymentUseCase } from '../../application/use-cases/add-payment.use-case';
import { ApplyDiscountUseCase } from '../../application/use-cases/apply-discount.use-case';
import { VoidTicketUseCase } from '../../application/use-cases/void-ticket.use-case';

const TICKET_STATUSES = Object.values(TicketStatus);

function scopedBranch(user: AuthUser, explicit?: string): string {
  return user.role === Role.OWNER && explicit
    ? explicit
    : (user.branchId ?? explicit ?? '');
}

@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly createTicket: CreateTicketUseCase,
    private readonly findAllTickets: FindAllTicketsUseCase,
    private readonly findOneTicket: FindOneTicketUseCase,
    private readonly addPayment: AddPaymentUseCase,
    private readonly applyDiscount: ApplyDiscountUseCase,
    private readonly voidTicket: VoidTicketUseCase,
  ) {}

  @Post()
  @Roles(Role.BARBER)
  create(@Body() dto: CreateTicketDto, @CurrentUser() user: AuthUser) {
    return this.createTicket.execute(dto, user.id, user.branchId ?? '');
  }

  @Get()
  @Roles(Role.OWNER, Role.CASHIER)
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('branchId') queryBranchId?: string,
    @Query('status') status?: string,
    @Query('barberId') barberId?: string,
  ) {
    if (
      status !== undefined &&
      !TICKET_STATUSES.includes(status as TicketStatus)
    ) {
      throw new BadRequestException(`Estado inválido: ${status}`);
    }
    return this.findAllTickets.execute(
      scopedBranch(user, queryBranchId),
      status as TicketStatus | undefined,
      barberId,
    );
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.CASHIER, Role.BARBER)
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.findOneTicket.execute(id, {
      branchId: user.role === Role.OWNER ? undefined : (user.branchId ?? ''),
      barberId: user.role === Role.BARBER ? user.id : undefined,
    });
  }

  @Post(':id/payments')
  @Roles(Role.OWNER, Role.CASHIER)
  pay(
    @Param('id') id: string,
    @Body() dto: AddPaymentDto,
    @CurrentUser() user: AuthUser,
  ) {
    const scope = user.role === Role.OWNER ? undefined : (user.branchId ?? '');
    return this.addPayment.execute(id, dto, user.id, scope);
  }

  @Patch(':id/discount')
  @Roles(Role.OWNER, Role.CASHIER)
  discount(
    @Param('id') id: string,
    @Body() dto: ApplyDiscountDto,
    @CurrentUser() user: AuthUser,
  ) {
    const scope = user.role === Role.OWNER ? undefined : (user.branchId ?? '');
    return this.applyDiscount.execute(id, dto.discountAmount, scope);
  }

  @Post(':id/void')
  @Roles(Role.OWNER)
  void(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.voidTicket.execute(id, user.id);
  }
}
