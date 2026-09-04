import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ItemType, QueueStatus } from '@prisma/client';
import {
  TICKET_REPOSITORY,
  type ITicketRepository,
} from '../../domain/repositories/ticket.repository';
import {
  TICKET_EVENTS,
  type ITicketEvents,
} from '../../domain/repositories/ticket-events.repository';
import type { CreateTicketItemData } from '../../domain/interfaces/ticket-data.interface';
import {
  SERVICE_REPOSITORY,
  type IServiceRepository,
} from '../../../services/domain/repositories/service.repository';
import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '../../../products/domain/repositories/product.repository';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../users/domain/repositories/user.repository';
import {
  COMMISSION_RULE_REPOSITORY,
  type ICommissionRuleRepository,
} from '../../../commission-rules/domain/repositories/commission-rule.repository';
import {
  QUEUE_REPOSITORY,
  type IQueueRepository,
} from '../../../queue/domain/repositories/queue.repository';
import { CommissionResolverService } from '../../../commission-rules/application/services/commission-resolver.service';
import { GetSettingUseCase } from '../../../settings/application/use-cases/get-setting.use-case';
import {
  buildTicketCode,
  calculateLine,
  calculateTotals,
} from '../services/ticket-totals.service';
import { CreateTicketDto, TicketItemInputDto } from '../dto/create-ticket.dto';

export const TAX_RATE_SETTING_KEY = 'tax_rate';
export const COMMISSION_BASE_PERCENTAGE_KEY = 'commission_base_percentage';

@Injectable()
export class CreateTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: ITicketRepository,
    @Inject(SERVICE_REPOSITORY) private readonly services: IServiceRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: IProductRepository,
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(COMMISSION_RULE_REPOSITORY)
    private readonly rules: ICommissionRuleRepository,
    @Inject(QUEUE_REPOSITORY) private readonly queue: IQueueRepository,
    private readonly getSetting: GetSettingUseCase,
    private readonly commissions: CommissionResolverService,
    @Inject(TICKET_EVENTS) private readonly events: ITicketEvents,
  ) {}

  async execute(dto: CreateTicketDto, barberId: string, branchId: string) {
    if (!branchId) {
      throw new BadRequestException(
        'Se requiere especificar la sucursal (branchId)',
      );
    }
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('El ticket requiere al menos un ítem');
    }
    const barber = await this.users.findById(barberId);
    if (!barber) {
      throw new NotFoundException(`Barbero no encontrado: ${barberId}`);
    }
    const taxRate = await this.numericSetting(TAX_RATE_SETTING_KEY, branchId);
    const basePercentage = await this.numericSetting(
      COMMISSION_BASE_PERCENTAGE_KEY,
      branchId,
    );
    const rules = await this.rules.findAll();

    const entry = dto.queueEntryId
      ? await this.loadQueueEntry(dto.queueEntryId, barberId, branchId)
      : null;

    const items: CreateTicketItemData[] = [];
    const lines: {
      lineBase: number;
      discountAmount: number;
      taxAmount: number;
    }[] = [];
    for (const item of dto.items) {
      const built = await this.buildItem(
        item,
        branchId,
        barberId,
        barber,
        taxRate,
        basePercentage,
        rules,
      );
      items.push(built.item);
      lines.push(built.line);
    }
    const totals = calculateTotals(lines, 0);

    const ticket = await this.tickets.createTicket({
      code: buildTicketCode(),
      branchId,
      barberId,
      customerId: dto.customerId ?? entry?.customerId ?? null,
      queueEntryId: entry?.id ?? null,
      subtotal: totals.subtotal,
      discountAmount: 0,
      taxAmount: totals.taxAmount,
      total: totals.total,
      items,
    });

    if (entry) {
      await this.queue.updateStatus(entry.id, {
        status: QueueStatus.COMPLETED,
        calledAt: entry.calledAt,
        closedAt: new Date(),
      });
    }
    await this.events.emitTicketCreated(branchId, ticket.id);
    return ticket;
  }

  private async numericSetting(key: string, branchId: string): Promise<number> {
    const setting = await this.getSetting.execute(key, branchId);
    const value = Number(setting.value);
    if (Number.isNaN(value)) {
      throw new BadRequestException(
        `El setting ${key} no es numérico: ${setting.value}`,
      );
    }
    return value;
  }

  private async loadQueueEntry(
    entryId: string,
    barberId: string,
    branchId: string,
  ) {
    const entry = await this.queue.findById(entryId);
    if (!entry) {
      throw new NotFoundException(`Entrada de cola no encontrada: ${entryId}`);
    }
    if (entry.branchId !== branchId) {
      throw new ForbiddenException(
        'La entrada de cola pertenece a otra sucursal',
      );
    }
    if (entry.status !== QueueStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Solo se puede facturar una entrada de cola IN_PROGRESS',
      );
    }
    if (entry.assignedBarberId && entry.assignedBarberId !== barberId) {
      throw new BadRequestException(
        'La entrada de cola está asignada a otro barbero',
      );
    }
    return entry;
  }

  private async buildItem(
    item: TicketItemInputDto,
    branchId: string,
    barberId: string,
    barber: { commissionRate: number | null },
    taxRate: number,
    basePercentage: number,
    rules: Parameters<CommissionResolverService['resolve']>[0]['rules'],
  ): Promise<{
    item: CreateTicketItemData;
    line: { lineBase: number; discountAmount: number; taxAmount: number };
  }> {
    const quantity = item.quantity ?? 1;
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new BadRequestException(
        'La cantidad debe ser un entero mayor a cero',
      );
    }

    if (item.itemType === ItemType.SERVICE) {
      if (!item.serviceId || item.productId) {
        throw new BadRequestException(
          'El ítem de servicio requiere serviceId (sin productId)',
        );
      }
      const svc = await this.services.findById(item.serviceId);
      if (!svc)
        throw new NotFoundException(
          `Servicio no encontrado: ${item.serviceId}`,
        );
      if (!svc.isActive)
        throw new BadRequestException('El servicio no está disponible');
      return this.snapshot(
        ItemType.SERVICE,
        svc.id,
        null,
        svc.name,
        svc.price,
        quantity,
        taxRate,
        this.commissions.resolve({
          rules,
          branchId,
          barberId,
          serviceId: svc.id,
          serviceCategoryId: svc.categoryId,
          quantity,
          unitPrice: svc.price,
          barberCommissionRate: barber.commissionRate,
          basePercentage,
        }),
      );
    }

    if (!item.productId || item.serviceId) {
      throw new BadRequestException(
        'El ítem de producto requiere productId (sin serviceId)',
      );
    }
    const prod = await this.products.findById(item.productId);
    if (!prod)
      throw new NotFoundException(`Producto no encontrado: ${item.productId}`);
    if (!prod.isActive)
      throw new BadRequestException('El producto no está disponible');
    return this.snapshot(
      ItemType.PRODUCT,
      null,
      prod.id,
      prod.name,
      prod.price,
      quantity,
      taxRate,
      this.commissions.resolve({
        rules,
        branchId,
        barberId,
        productId: prod.id,
        quantity,
        unitPrice: prod.price,
        barberCommissionRate: barber.commissionRate,
        basePercentage,
      }),
    );
  }

  private snapshot(
    itemType: ItemType,
    serviceId: string | null,
    productId: string | null,
    description: string,
    unitPrice: number,
    quantity: number,
    taxRate: number,
    commission: {
      type: CreateTicketItemData['commissionType'];
      value: number;
      amount: number;
    },
  ): {
    item: CreateTicketItemData;
    line: { lineBase: number; discountAmount: number; taxAmount: number };
  } {
    const line = calculateLine({ quantity, unitPrice, taxRate });
    return {
      item: {
        itemType,
        serviceId,
        productId,
        description,
        quantity,
        unitPrice,
        discountAmount: line.discountAmount,
        taxRate,
        taxAmount: line.taxAmount,
        lineTotal: line.lineTotal,
        commissionType: commission.type,
        commissionValue: commission.value,
        commissionAmount: commission.amount,
      },
      line: {
        lineBase: line.lineBase,
        discountAmount: line.discountAmount,
        taxAmount: line.taxAmount,
      },
    };
  }
}
