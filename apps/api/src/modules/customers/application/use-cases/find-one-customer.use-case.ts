import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CUSTOMER_REPOSITORY,
  type ICustomerRepository,
} from '../../domain/repositories/customer.repository';

@Injectable()
export class FindOneCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customers: ICustomerRepository,
  ) {}

  async execute(id: string) {
    const customer = await this.customers.findById(id);
    if (!customer) {
      throw new NotFoundException(`Cliente no encontrado: ${id}`);
    }
    return customer;
  }
}
