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
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CreateServiceDto } from '../../application/dto/create-service.dto';
import { UpdateServiceDto } from '../../application/dto/update-service.dto';
import { CreateServiceUseCase } from '../../application/use-cases/create-service.use-case';
import { FindAllServicesUseCase } from '../../application/use-cases/find-all-services.use-case';
import { FindOneServiceUseCase } from '../../application/use-cases/find-one-service.use-case';
import { UpdateServiceUseCase } from '../../application/use-cases/update-service.use-case';
import { DeleteServiceUseCase } from '../../application/use-cases/delete-service.use-case';

@Controller('services')
export class ServicesController {
  constructor(
    private readonly createService: CreateServiceUseCase,
    private readonly findAllServices: FindAllServicesUseCase,
    private readonly findOneService: FindOneServiceUseCase,
    private readonly updateService: UpdateServiceUseCase,
    private readonly deleteService: DeleteServiceUseCase,
  ) {}

  @Post()
  @Roles(Role.OWNER)
  create(@Body() dto: CreateServiceDto) {
    return this.createService.execute(dto);
  }

  @Get()
  @Roles(Role.OWNER, Role.CASHIER, Role.BARBER)
  findAll(@Query('categoryId') categoryId?: string) {
    return this.findAllServices.execute(categoryId);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.CASHIER, Role.BARBER)
  findOne(@Param('id') id: string) {
    return this.findOneService.execute(id);
  }

  @Patch(':id')
  @Roles(Role.OWNER)
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.updateService.execute(id, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.deleteService.execute(id);
  }
}
