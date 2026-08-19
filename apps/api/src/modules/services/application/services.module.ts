import { Module } from '@nestjs/common';
import { SERVICE_REPOSITORY } from '../domain/repositories/service.repository';
import { PrismaServiceRepository } from '../infrastructure/persistence/prisma-service.repository';
import { ServicesController } from '../interfaces/controllers/services.controller';
import { CreateServiceUseCase } from './use-cases/create-service.use-case';
import { FindAllServicesUseCase } from './use-cases/find-all-services.use-case';
import { FindOneServiceUseCase } from './use-cases/find-one-service.use-case';
import { UpdateServiceUseCase } from './use-cases/update-service.use-case';
import { DeleteServiceUseCase } from './use-cases/delete-service.use-case';

@Module({
  controllers: [ServicesController],
  providers: [
    { provide: SERVICE_REPOSITORY, useClass: PrismaServiceRepository },
    CreateServiceUseCase,
    FindAllServicesUseCase,
    FindOneServiceUseCase,
    UpdateServiceUseCase,
    DeleteServiceUseCase,
  ],
  exports: [SERVICE_REPOSITORY],
})
export class ServicesModule {}
