import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  SERVICE_REPOSITORY,
  type IServiceRepository,
} from '../../domain/repositories/service.repository';

@Injectable()
export class DeleteServiceUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY) private readonly services: IServiceRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.services.findById(id);
    if (!existing) {
      throw new NotFoundException(`Servicio #${id} no encontrado`);
    }
    await this.services.softDelete(id);
  }
}
