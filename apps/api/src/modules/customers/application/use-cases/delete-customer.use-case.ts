import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CUSTOMER_REPOSITORY,
  type ICustomerRepository,
} from '../../domain/repositories/customer.repository';

@Injectable()
export class DeleteCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customers: ICustomerRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.customers.findById(id);
    if (!existing) {
      throw new NotFoundException(`Cliente no encontrado: ${id}`);
    }
    await this.customers.softDelete(id);
  }
}
