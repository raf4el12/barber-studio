import { Inject, Injectable } from '@nestjs/common';
import {
  SERVICE_CATEGORY_REPOSITORY,
  type IServiceCategoryRepository,
} from '../../domain/repositories/service-category.repository';

@Injectable()
export class FindAllServiceCategoriesUseCase {
  constructor(
    @Inject(SERVICE_CATEGORY_REPOSITORY)
    private readonly categories: IServiceCategoryRepository,
  ) {}

  execute() {
    return this.categories.findAll();
  }
}
