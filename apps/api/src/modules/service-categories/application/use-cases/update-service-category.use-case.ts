import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  SERVICE_CATEGORY_REPOSITORY,
  type IServiceCategoryRepository,
} from '../../domain/repositories/service-category.repository';
import { UpdateServiceCategoryDto } from '../dto/update-service-category.dto';

@Injectable()
export class UpdateServiceCategoryUseCase {
  constructor(
    @Inject(SERVICE_CATEGORY_REPOSITORY)
    private readonly categories: IServiceCategoryRepository,
  ) {}

  async execute(id: string, dto: UpdateServiceCategoryDto) {
    const existing = await this.categories.findById(id);
    if (!existing) {
      throw new NotFoundException(`Categoría #${id} no encontrada`);
    }
    return this.categories.update(id, dto);
  }
}
