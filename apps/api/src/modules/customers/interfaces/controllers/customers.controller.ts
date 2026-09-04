import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { BranchScopeGuard } from '../../../../common/guards/branch-scope.guard';
import {
  CurrentUser,
  type AuthUser,
} from '../../../../common/decorators/current-user.decorator';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CreateCustomerDto } from '../../application/dto/create-customer.dto';
import { UpdateCustomerDto } from '../../application/dto/update-customer.dto';
import { RedeemLoyaltyDto } from '../../application/dto/redeem-loyalty.dto';
import { CreateCustomerUseCase } from '../../application/use-cases/create-customer.use-case';
import { FindAllCustomersUseCase } from '../../application/use-cases/find-all-customers.use-case';
import { FindOneCustomerUseCase } from '../../application/use-cases/find-one-customer.use-case';
import { UpdateCustomerUseCase } from '../../application/use-cases/update-customer.use-case';
import { DeleteCustomerUseCase } from '../../application/use-cases/delete-customer.use-case';
import {
  GetCustomerHistoryUseCase,
  GetCustomerLoyaltyUseCase,
} from '../../application/use-cases/customer-queries.use-case';
import { RedeemLoyaltyUseCase } from '../../application/use-cases/loyalty.use-case';

@Controller('customers')
@Roles(Role.OWNER, Role.CASHIER)
@UseGuards(BranchScopeGuard)
export class CustomersController {
  constructor(
    private readonly createCustomer: CreateCustomerUseCase,
    private readonly findAllCustomers: FindAllCustomersUseCase,
    private readonly findOneCustomer: FindOneCustomerUseCase,
    private readonly updateCustomer: UpdateCustomerUseCase,
    private readonly deleteCustomer: DeleteCustomerUseCase,
    private readonly getHistory: GetCustomerHistoryUseCase,
    private readonly getLoyalty: GetCustomerLoyaltyUseCase,
    private readonly redeemLoyalty: RedeemLoyaltyUseCase,
  ) {}

  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.createCustomer.execute(dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('branchId') queryBranchId?: string,
  ) {
    const branchId =
      user.role === Role.OWNER
        ? queryBranchId
        : (user.branchId ?? queryBranchId);
    return this.findAllCustomers.execute(branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.findOneCustomer.execute(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.updateCustomer.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.deleteCustomer.execute(id);
  }

  @Get(':id/history')
  history(@Param('id') id: string, @Query('branchId') branchId?: string) {
    return this.getHistory.execute(id, branchId);
  }

  @Get(':id/loyalty')
  loyalty(@Param('id') id: string) {
    return this.getLoyalty.execute(id);
  }

  @Post(':id/loyalty/redeem')
  redeem(
    @Param('id') id: string,
    @Body() dto: RedeemLoyaltyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.redeemLoyalty.execute(id, dto.points, dto.reason, user.id);
  }
}
