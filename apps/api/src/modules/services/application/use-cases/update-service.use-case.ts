import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  SERVICE_REPOSITORY,
  type IServiceRepository,
} from '../../domain/repositories/service.repository';
import { UpdateServiceDto } from '../dto/update-service.dto';

@Injectable()
export class UpdateServiceUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY) private readonly services: IServiceRepository,
  ) {}

  async execute(id: string, dto: UpdateServiceDto) {
    const existing = await this.services.findById(id);
    if (!existing) {
      throw new NotFoundException(`Servicio #${id} no encontrado`);
    }
    return this.services.update(id, dto);
  }
}
