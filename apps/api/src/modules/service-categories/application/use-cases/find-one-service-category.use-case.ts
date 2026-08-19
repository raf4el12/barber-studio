import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  SERVICE_CATEGORY_REPOSITORY,
  type IServiceCategoryRepository,
} from '../../domain/repositories/service-category.repository';

@Injectable()
export class FindOneServiceCategoryUseCase {
  constructor(
    @Inject(SERVICE_CATEGORY_REPOSITORY)
    private readonly categories: IServiceCategoryRepository,
  ) {}

  async execute(id: string) {
    const category = await this.categories.findById(id);
    if (!category) {
      throw new NotFoundException(`Categoría #${id} no encontrada`);
    }
    return category;
  }
}
