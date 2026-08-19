import type { ProductEntity } from '../entities/product.entity';
import type {
  CreateProductData,
  UpdateProductData,
} from '../interfaces/product-data.interface';

export const PRODUCT_REPOSITORY = 'IProductRepository';

export interface IProductRepository {
  create(data: CreateProductData): Promise<ProductEntity>;
  findAll(): Promise<ProductEntity[]>;
  findById(id: string): Promise<ProductEntity | null>;
  findBySku(sku: string): Promise<ProductEntity | null>;
  existsBySku(sku: string): Promise<boolean>;
  update(id: string, data: UpdateProductData): Promise<ProductEntity>;
  softDelete(id: string): Promise<void>;
}
