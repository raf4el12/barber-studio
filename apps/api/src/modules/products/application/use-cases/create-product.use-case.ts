import { Inject, Injectable, ConflictException } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '../../domain/repositories/product.repository';
import { CreateProductDto } from '../dto/create-product.dto';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: IProductRepository,
  ) {}

  async execute(dto: CreateProductDto) {
    if (dto.sku && (await this.products.existsBySku(dto.sku))) {
      throw new ConflictException('Ya existe un producto con ese SKU');
    }
    return this.products.create(dto);
  }
}
