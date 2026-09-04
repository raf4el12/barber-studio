import { forwardRef, Module } from '@nestjs/common';
import { TICKET_REPOSITORY } from '../domain/repositories/ticket.repository';
import { TICKET_EVENTS } from '../domain/repositories/ticket-events.repository';
import { PrismaTicketRepository } from '../infrastructure/persistence/prisma-ticket.repository';
import { TicketsController } from '../interfaces/controllers/tickets.controller';
import { TicketsGateway } from '../interfaces/gateways/tickets.gateway';
import { CreateTicketUseCase } from './use-cases/create-ticket.use-case';
import { FindAllTicketsUseCase } from './use-cases/find-all-tickets.use-case';
import { FindOneTicketUseCase } from './use-cases/find-one-ticket.use-case';
import { AddPaymentUseCase } from './use-cases/add-payment.use-case';
import { ApplyDiscountUseCase } from './use-cases/apply-discount.use-case';
import { VoidTicketUseCase } from './use-cases/void-ticket.use-case';
import { CommissionRulesModule } from '../../commission-rules/application/commission-rules.module';
import { SettingsModule } from '../../settings/application/settings.module';
import { UsersModule } from '../../users/application/users.module';
import { ServicesModule } from '../../services/application/services.module';
import { ProductsModule } from '../../products/application/products.module';
import { InventoryModule } from '../../inventory/application/inventory.module';
import { PaymentMethodsModule } from '../../payment-methods/application/payment-methods.module';
import { CashRegistersModule } from '../../cash-registers/application/cash-registers.module';
import { QueueModule } from '../../queue/application/queue.module';
import { CustomersModule } from '../../customers/application/customers.module';

@Module({
  imports: [
    CommissionRulesModule,
    SettingsModule,
    UsersModule,
    ServicesModule,
    ProductsModule,
    InventoryModule,
    PaymentMethodsModule,
    CashRegistersModule,
    forwardRef(() => QueueModule),
    forwardRef(() => CustomersModule),
  ],
  controllers: [TicketsController],
  providers: [
    { provide: TICKET_REPOSITORY, useClass: PrismaTicketRepository },
    { provide: TICKET_EVENTS, useExisting: TicketsGateway },
    TicketsGateway,
    CreateTicketUseCase,
    FindAllTicketsUseCase,
    FindOneTicketUseCase,
    AddPaymentUseCase,
    ApplyDiscountUseCase,
    VoidTicketUseCase,
  ],
  exports: [TICKET_REPOSITORY],
})
export class TicketsModule {}
