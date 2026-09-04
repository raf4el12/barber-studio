import { Module } from '@nestjs/common';
import { INVENTORY_REPOSITORY } from '../domain/repositories/inventory.repository';
import { PrismaInventoryRepository } from '../infrastructure/persistence/prisma-inventory.repository';
import { InventoryController } from '../interfaces/controllers/inventory.controller';
import { RegisterStockMovementUseCase } from './use-cases/register-stock-movement.use-case';
import { FindBranchInventoryUseCase } from './use-cases/find-branch-inventory.use-case';
import { FindLowStockInventoryUseCase } from './use-cases/find-low-stock-inventory.use-case';
import { UpdateStockThresholdUseCase } from './use-cases/update-stock-threshold.use-case';
import { AuditModule } from '../../audit/application/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [InventoryController],
  providers: [
    { provide: INVENTORY_REPOSITORY, useClass: PrismaInventoryRepository },
    RegisterStockMovementUseCase,
    FindBranchInventoryUseCase,
    FindLowStockInventoryUseCase,
    UpdateStockThresholdUseCase,
  ],
  exports: [INVENTORY_REPOSITORY],
})
export class InventoryModule {}
