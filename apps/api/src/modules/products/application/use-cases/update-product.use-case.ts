import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '../../domain/repositories/product.repository';
import { UpdateProductDto } from '../dto/update-product.dto';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: IProductRepository,
  ) {}

  async execute(id: string, dto: UpdateProductDto) {
    const existing = await this.products.findById(id);
    if (!existing) {
      throw new NotFoundException(`Producto #${id} no encontrado`);
    }
    if (dto.sku && dto.sku !== existing.sku) {
      if (await this.products.existsBySku(dto.sku)) {
        throw new ConflictException('Ya existe un producto con ese SKU');
      }
    }
    return this.products.update(id, dto);
  }
}
