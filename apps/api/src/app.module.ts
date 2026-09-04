import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BranchesModule } from './modules/branches/application/branches.module';
import { UsersModule } from './modules/users/application/users.module';
import { ServiceCategoriesModule } from './modules/service-categories/application/service-categories.module';
import { ServicesModule } from './modules/services/application/services.module';
import { ProductsModule } from './modules/products/application/products.module';
import { InventoryModule } from './modules/inventory/application/inventory.module';
import { SettingsModule } from './modules/settings/application/settings.module';
import { CommissionRulesModule } from './modules/commission-rules/application/commission-rules.module';
import { QueueModule } from './modules/queue/application/queue.module';
import { PaymentMethodsModule } from './modules/payment-methods/application/payment-methods.module';
import { CashRegistersModule } from './modules/cash-registers/application/cash-registers.module';
import { TicketsModule } from './modules/tickets/application/tickets.module';
import { CustomersModule } from './modules/customers/application/customers.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    BranchesModule,
    UsersModule,
    ServiceCategoriesModule,
    ServicesModule,
    ProductsModule,
    InventoryModule,
    SettingsModule,
    CommissionRulesModule,
    QueueModule,
    PaymentMethodsModule,
    CashRegistersModule,
    TicketsModule,
    CustomersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
