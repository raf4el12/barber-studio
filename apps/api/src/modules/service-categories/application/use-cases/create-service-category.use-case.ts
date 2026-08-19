import { Inject, Injectable, ConflictException } from '@nestjs/common';
import {
  SERVICE_CATEGORY_REPOSITORY,
  type IServiceCategoryRepository,
} from '../../domain/repositories/service-category.repository';
import { CreateServiceCategoryDto } from '../dto/create-service-category.dto';

@Injectable()
export class CreateServiceCategoryUseCase {
  constructor(
    @Inject(SERVICE_CATEGORY_REPOSITORY)
    private readonly categories: IServiceCategoryRepository,
  ) {}

  async execute(dto: CreateServiceCategoryDto) {
    if (await this.categories.existsByName(dto.name)) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }
    return this.categories.create(dto);
  }
}
