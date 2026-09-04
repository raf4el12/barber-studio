import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CreatePaymentMethodDto } from '../../application/dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from '../../application/dto/update-payment-method.dto';
import { CreatePaymentMethodUseCase } from '../../application/use-cases/create-payment-method.use-case';
import { FindAllPaymentMethodsUseCase } from '../../application/use-cases/find-all-payment-methods.use-case';
import { UpdatePaymentMethodUseCase } from '../../application/use-cases/update-payment-method.use-case';
import { DeletePaymentMethodUseCase } from '../../application/use-cases/delete-payment-method.use-case';

function parseActive(value?: string): boolean | undefined {
  if (value === undefined) return undefined;
  return value === 'true';
}

@Controller('payment-methods')
@Roles(Role.OWNER)
export class PaymentMethodsController {
  constructor(
    private readonly createMethod: CreatePaymentMethodUseCase,
    private readonly findAllMethods: FindAllPaymentMethodsUseCase,
    private readonly updateMethod: UpdatePaymentMethodUseCase,
    private readonly deleteMethod: DeletePaymentMethodUseCase,
  ) {}

  @Post()
  create(@Body() dto: CreatePaymentMethodDto) {
    return this.createMethod.execute(dto);
  }

  @Get()
  findAll(@Query('isActive') isActive?: string) {
    return this.findAllMethods.execute(parseActive(isActive));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePaymentMethodDto) {
    return this.updateMethod.execute(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.deleteMethod.execute(id);
    if (result === null) {
      return { deleted: true };
    }
    return result;
  }
}
