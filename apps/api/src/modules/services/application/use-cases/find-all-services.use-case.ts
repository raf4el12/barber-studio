import { Inject, Injectable } from '@nestjs/common';
import {
  SERVICE_REPOSITORY,
  type IServiceRepository,
} from '../../domain/repositories/service.repository';

@Injectable()
export class FindAllServicesUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY) private readonly services: IServiceRepository,
  ) {}

  execute(categoryId?: string) {
    return this.services.findAll(categoryId);
  }
}
