import { Module } from '@nestjs/common';
import { PRODUCT_REPOSITORY } from '../domain/repositories/product.repository';
import { PrismaProductRepository } from '../infrastructure/persistence/prisma-product.repository';
import { ProductsController } from '../interfaces/controllers/products.controller';
import { CreateProductUseCase } from './use-cases/create-product.use-case';
import { FindAllProductsUseCase } from './use-cases/find-all-products.use-case';
import { FindOneProductUseCase } from './use-cases/find-one-product.use-case';
import { UpdateProductUseCase } from './use-cases/update-product.use-case';
import { DeleteProductUseCase } from './use-cases/delete-product.use-case';

@Module({
  controllers: [ProductsController],
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
    CreateProductUseCase,
    FindAllProductsUseCase,
    FindOneProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
  ],
  exports: [PRODUCT_REPOSITORY],
})
export class ProductsModule {}
