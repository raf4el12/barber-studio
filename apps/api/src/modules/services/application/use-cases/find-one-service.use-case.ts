import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  SERVICE_REPOSITORY,
  type IServiceRepository,
} from '../../domain/repositories/service.repository';

@Injectable()
export class FindOneServiceUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY) private readonly services: IServiceRepository,
  ) {}

  async execute(id: string) {
    const service = await this.services.findById(id);
    if (!service) {
      throw new NotFoundException(`Servicio #${id} no encontrado`);
    }
    return service;
  }
}
