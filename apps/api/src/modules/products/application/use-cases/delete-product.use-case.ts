import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '../../domain/repositories/product.repository';

@Injectable()
export class DeleteProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: IProductRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.products.findById(id);
    if (!existing) {
      throw new NotFoundException(`Producto #${id} no encontrado`);
    }
    await this.products.softDelete(id);
  }
}
