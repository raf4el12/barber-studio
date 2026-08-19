import type { ServiceEntity } from '../entities/service.entity';
import type {
  CreateServiceData,
  UpdateServiceData,
} from '../interfaces/service-data.interface';

export const SERVICE_REPOSITORY = 'IServiceRepository';

export interface IServiceRepository {
  create(data: CreateServiceData): Promise<ServiceEntity>;
  findAll(categoryId?: string): Promise<ServiceEntity[]>;
  findById(id: string): Promise<ServiceEntity | null>;
  existsByName(name: string): Promise<boolean>;
  update(id: string, data: UpdateServiceData): Promise<ServiceEntity>;
  softDelete(id: string): Promise<void>;
}
