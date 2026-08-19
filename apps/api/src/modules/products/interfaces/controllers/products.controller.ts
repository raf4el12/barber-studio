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
import { CreateProductDto } from '../../application/dto/create-product.dto';
import { UpdateProductDto } from '../../application/dto/update-product.dto';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case';
import { FindAllProductsUseCase } from '../../application/use-cases/find-all-products.use-case';
import { FindOneProductUseCase } from '../../application/use-cases/find-one-product.use-case';
import { UpdateProductUseCase } from '../../application/use-cases/update-product.use-case';
import { DeleteProductUseCase } from '../../application/use-cases/delete-product.use-case';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly findAllProducts: FindAllProductsUseCase,
    private readonly findOneProduct: FindOneProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly deleteProduct: DeleteProductUseCase,
  ) {}

  @Post()
  @Roles(Role.OWNER)
  create(@Body() dto: CreateProductDto) {
    return this.createProduct.execute(dto);
  }

  @Get()
  @Roles(Role.OWNER, Role.CASHIER, Role.BARBER)
  findAll() {
    return this.findAllProducts.execute();
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.CASHIER, Role.BARBER)
  findOne(@Param('id') id: string) {
    return this.findOneProduct.execute(id);
  }

  @Patch(':id')
  @Roles(Role.OWNER)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.updateProduct.execute(id, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.deleteProduct.execute(id);
  }
}
