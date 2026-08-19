import { Module } from '@nestjs/common';
import { SERVICE_CATEGORY_REPOSITORY } from '../domain/repositories/service-category.repository';
import { PrismaServiceCategoryRepository } from '../infrastructure/persistence/prisma-service-category.repository';
import { ServiceCategoriesController } from '../interfaces/controllers/service-categories.controller';
import { CreateServiceCategoryUseCase } from './use-cases/create-service-category.use-case';
import { FindAllServiceCategoriesUseCase } from './use-cases/find-all-service-categories.use-case';
import { FindOneServiceCategoryUseCase } from './use-cases/find-one-service-category.use-case';
import { UpdateServiceCategoryUseCase } from './use-cases/update-service-category.use-case';
import { DeleteServiceCategoryUseCase } from './use-cases/delete-service-category.use-case';

@Module({
  controllers: [ServiceCategoriesController],
  providers: [
    {
      provide: SERVICE_CATEGORY_REPOSITORY,
      useClass: PrismaServiceCategoryRepository,
    },
    CreateServiceCategoryUseCase,
    FindAllServiceCategoriesUseCase,
    FindOneServiceCategoryUseCase,
    UpdateServiceCategoryUseCase,
    DeleteServiceCategoryUseCase,
  ],
  exports: [SERVICE_CATEGORY_REPOSITORY],
})
export class ServiceCategoriesModule {}
