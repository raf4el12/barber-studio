import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ItemType, StockMovementType, TicketStatus } from '@prisma/client';
import {
  TICKET_REPOSITORY,
  type ITicketRepository,
} from '../../domain/repositories/ticket.repository';
import {
  TICKET_EVENTS,
  type ITicketEvents,
} from '../../domain/repositories/ticket-events.repository';
import {
  PAYMENT_METHOD_REPOSITORY,
  type IPaymentMethodRepository,
} from '../../../payment-methods/domain/repositories/payment-method.repository';
import {
  CASH_REGISTER_REPOSITORY,
  type ICashRegisterRepository,
} from '../../../cash-registers/domain/repositories/cash-register.repository';
import {
  INVENTORY_REPOSITORY,
  type IInventoryRepository,
} from '../../../inventory/domain/repositories/inventory.repository';
import { AccrueLoyaltyUseCase } from '../../../customers/application/use-cases/loyalty.use-case';
import { roundMoney } from '../services/ticket-totals.service';
import { AddPaymentDto } from '../dto/add-payment.dto';

@Injectable()
export class AddPaymentUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: ITicketRepository,
    @Inject(PAYMENT_METHOD_REPOSITORY)
    private readonly methods: IPaymentMethodRepository,
    @Inject(CASH_REGISTER_REPOSITORY)
    private readonly registers: ICashRegisterRepository,
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventory: IInventoryRepository,
    @Inject(TICKET_EVENTS) private readonly events: ITicketEvents,
    private readonly accrueLoyalty: AccrueLoyaltyUseCase,
  ) {}

  async execute(
    ticketId: string,
    dto: AddPaymentDto,
    cashierId: string,
    scopeBranchId?: string,
  ) {
    const ticket = await this.tickets.findById(ticketId);
    if (!ticket) {
      throw new NotFoundException(`Ticket no encontrado: ${ticketId}`);
    }
    if (scopeBranchId && ticket.branchId !== scopeBranchId) {
      throw new ForbiddenException('El ticket pertenece a otra sucursal');
    }
    if (ticket.status === TicketStatus.VOIDED) {
      throw new BadRequestException('No se puede cobrar un ticket anulado');
    }
    if (ticket.status === TicketStatus.PAID) {
      throw new BadRequestException('El ticket ya está pagado');
    }
    const method = await this.methods.findById(dto.paymentMethodId);
    if (!method) {
      throw new NotFoundException(
        `Método de pago no encontrado: ${dto.paymentMethodId}`,
      );
    }
    if (!method.isActive) {
      throw new BadRequestException('El método de pago no está activo');
    }
    if (dto.amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a cero');
    }
    const tip = dto.tipAmount ?? 0;
    if (tip < 0) {
      throw new BadRequestException('La propina no puede ser negativa');
    }
    const register = await this.registers.findActive(ticket.branchId);
    if (!register) {
      throw new BadRequestException('Sin caja abierta en esta sucursal');
    }

    const newTipTotal = roundMoney(ticket.tipAmount + tip);
    const due = roundMoney(ticket.total + newTipTotal - ticket.amountPaid);
    if (dto.amount > due) {
      throw new BadRequestException(`Sobrepago: el saldo es ${due}`);
    }
    const completes = roundMoney(ticket.amountPaid + dto.amount) >= due;

    if (completes) {
      await this.assertStock(ticket.branchId, ticket.items);
    }
    await this.tickets.createPayment({
      ticketId,
      paymentMethodId: method.id,
      amount: dto.amount,
      cashierId,
      cashRegisterId: register.id,
    });

    if (!completes) {
      const updated = await this.tickets.updateTicket(ticketId, {
        status: TicketStatus.PARTIALLY_PAID,
        tipAmount: newTipTotal,
      });
      await this.events.emitTicketUpdated(ticket.branchId, ticketId);
      return updated;
    }

    const now = new Date();
    const updated = await this.tickets.updateTicket(ticketId, {
      status: TicketStatus.PAID,
      tipAmount: newTipTotal,
      paidAt: now,
    });
    for (const item of ticket.items) {
      if (item.itemType !== ItemType.PRODUCT || !item.productId) continue;
      await this.inventory.registerMovement({
        branchId: ticket.branchId,
        productId: item.productId,
        type: StockMovementType.SALE,
        quantity: -item.quantity,
        reference: ticket.code,
        createdById: cashierId,
      });
    }
    if (ticket.customerId) {
      await this.accrueLoyalty.execute({
        customerId: ticket.customerId,
        total: ticket.total,
        ticketId,
        ticketCode: ticket.code,
        branchId: ticket.branchId,
      });
    }
    await this.events.emitTicketPaid(ticket.branchId, ticketId);
    return updated;
  }

  private async assertStock(
    branchId: string,
    items: { itemType: ItemType; productId: string | null; quantity: number }[],
  ): Promise<void> {
    for (const item of items) {
      if (item.itemType !== ItemType.PRODUCT || !item.productId) continue;
      const stock = await this.inventory.findByBranchAndProduct(
        branchId,
        item.productId,
      );
      if ((stock?.quantity ?? 0) < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para el producto (disponible: ${stock?.quantity ?? 0})`,
        );
      }
    }
  }
}
