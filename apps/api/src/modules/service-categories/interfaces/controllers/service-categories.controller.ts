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
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CreateServiceCategoryDto } from '../../application/dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from '../../application/dto/update-service-category.dto';
import { CreateServiceCategoryUseCase } from '../../application/use-cases/create-service-category.use-case';
import { FindAllServiceCategoriesUseCase } from '../../application/use-cases/find-all-service-categories.use-case';
import { FindOneServiceCategoryUseCase } from '../../application/use-cases/find-one-service-category.use-case';
import { UpdateServiceCategoryUseCase } from '../../application/use-cases/update-service-category.use-case';
import { DeleteServiceCategoryUseCase } from '../../application/use-cases/delete-service-category.use-case';

@Controller('service-categories')
export class ServiceCategoriesController {
  constructor(
    private readonly createCategory: CreateServiceCategoryUseCase,
    private readonly findAllCategories: FindAllServiceCategoriesUseCase,
    private readonly findOneCategory: FindOneServiceCategoryUseCase,
    private readonly updateCategory: UpdateServiceCategoryUseCase,
    private readonly deleteCategory: DeleteServiceCategoryUseCase,
  ) {}

  @Post()
  @Roles(Role.OWNER)
  create(@Body() dto: CreateServiceCategoryDto) {
    return this.createCategory.execute(dto);
  }

  @Get()
  @Roles(Role.OWNER, Role.CASHIER, Role.BARBER)
  findAll() {
    return this.findAllCategories.execute();
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.CASHIER, Role.BARBER)
  findOne(@Param('id') id: string) {
    return this.findOneCategory.execute(id);
  }

  @Patch(':id')
  @Roles(Role.OWNER)
  update(@Param('id') id: string, @Body() dto: UpdateServiceCategoryDto) {
    return this.updateCategory.execute(id, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.deleteCategory.execute(id);
  }
}
