import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  CurrentUser,
  type AuthUser,
} from '../../../../common/decorators/current-user.decorator';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { RegisterStockMovementDto } from '../../application/dto/register-stock-movement.dto';
import { UpdateStockThresholdDto } from '../../application/dto/update-stock-threshold.dto';
import { RegisterStockMovementUseCase } from '../../application/use-cases/register-stock-movement.use-case';
import { FindBranchInventoryUseCase } from '../../application/use-cases/find-branch-inventory.use-case';
import { FindLowStockInventoryUseCase } from '../../application/use-cases/find-low-stock-inventory.use-case';
import { UpdateStockThresholdUseCase } from '../../application/use-cases/update-stock-threshold.use-case';

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly registerMovement: RegisterStockMovementUseCase,
    private readonly findBranchInventory: FindBranchInventoryUseCase,
    private readonly findLowStockInventory: FindLowStockInventoryUseCase,
    private readonly updateThreshold: UpdateStockThresholdUseCase,
  ) {}

  @Post('movements')
  @Roles(Role.OWNER, Role.CASHIER)
  createMovement(
    @Body() dto: RegisterStockMovementDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.registerMovement.execute(
      dto,
      user.branchId ?? dto.branchId ?? '',
      user.id,
    );
  }

  @Get()
  @Roles(Role.OWNER, Role.CASHIER, Role.BARBER)
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('branchId') queryBranchId?: string,
  ) {
    const branchId =
      user.role === Role.OWNER && queryBranchId
        ? queryBranchId
        : (user.branchId ?? queryBranchId ?? '');
    return this.findBranchInventory.execute(branchId);
  }

  @Get('low-stock')
  @Roles(Role.OWNER, Role.CASHIER)
  findLowStock(
    @CurrentUser() user: AuthUser,
    @Query('branchId') queryBranchId?: string,
  ) {
    const branchId =
      user.role === Role.OWNER && queryBranchId
        ? queryBranchId
        : (user.branchId ?? queryBranchId ?? '');
    return this.findLowStockInventory.execute(branchId);
  }

  @Patch('threshold')
  @Roles(Role.OWNER)
  updateStockThreshold(
    @Body() dto: UpdateStockThresholdDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.updateThreshold.execute(
      dto,
      user.branchId ?? dto.branchId ?? '',
    );
  }
}
