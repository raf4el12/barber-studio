import { Inject, Injectable } from '@nestjs/common';
import {
  CUSTOMER_REPOSITORY,
  type ICustomerRepository,
} from '../../domain/repositories/customer.repository';

@Injectable()
export class FindAllCustomersUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customers: ICustomerRepository,
  ) {}

  execute(branchId?: string) {
    return this.customers.findAll(branchId);
  }
}
