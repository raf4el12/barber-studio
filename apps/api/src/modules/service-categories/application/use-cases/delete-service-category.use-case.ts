import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  SERVICE_CATEGORY_REPOSITORY,
  type IServiceCategoryRepository,
} from '../../domain/repositories/service-category.repository';

@Injectable()
export class DeleteServiceCategoryUseCase {
  constructor(
    @Inject(SERVICE_CATEGORY_REPOSITORY)
    private readonly categories: IServiceCategoryRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.categories.findById(id);
    if (!existing) {
      throw new NotFoundException(`Categoría #${id} no encontrada`);
    }
    await this.categories.softDelete(id);
  }
}
