import { Inject, Injectable, ConflictException } from '@nestjs/common';
import {
  SERVICE_REPOSITORY,
  type IServiceRepository,
} from '../../domain/repositories/service.repository';
import { CreateServiceDto } from '../dto/create-service.dto';

@Injectable()
export class CreateServiceUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY) private readonly services: IServiceRepository,
  ) {}

  async execute(dto: CreateServiceDto) {
    if (await this.services.existsByName(dto.name)) {
      throw new ConflictException('Ya existe un servicio con ese nombre');
    }
    return this.services.create(dto);
  }
}
