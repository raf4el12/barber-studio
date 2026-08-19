import type { ServiceCategoryEntity } from '../entities/service-category.entity';
import type {
  CreateServiceCategoryData,
  UpdateServiceCategoryData,
} from '../interfaces/service-category-data.interface';

export const SERVICE_CATEGORY_REPOSITORY = 'IServiceCategoryRepository';

export interface IServiceCategoryRepository {
  create(data: CreateServiceCategoryData): Promise<ServiceCategoryEntity>;
  findAll(): Promise<ServiceCategoryEntity[]>;
  findById(id: string): Promise<ServiceCategoryEntity | null>;
  existsByName(name: string): Promise<boolean>;
  update(
    id: string,
    data: UpdateServiceCategoryData,
  ): Promise<ServiceCategoryEntity>;
  softDelete(id: string): Promise<void>;
}
