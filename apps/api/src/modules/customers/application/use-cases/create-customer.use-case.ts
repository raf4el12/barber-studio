import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  CUSTOMER_REPOSITORY,
  type ICustomerRepository,
} from '../../domain/repositories/customer.repository';
import { CreateCustomerDto } from '../dto/create-customer.dto';

function emptyToNull(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

@Injectable()
export class CreateCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customers: ICustomerRepository,
  ) {}

  async execute(dto: CreateCustomerDto) {
    const email = emptyToNull(dto.email);
    const phone = emptyToNull(dto.phone);
    if (email && (await this.customers.existsByEmail(email))) {
      throw new ConflictException('Ya existe un cliente con ese email');
    }
    if (phone && (await this.customers.existsByPhone(phone))) {
      throw new ConflictException('Ya existe un cliente con ese teléfono');
    }
    return this.customers.create({
      name: dto.name.trim(),
      phone,
      email,
      notes: emptyToNull(dto.notes),
      branchId: dto.branchId ?? null,
      isActive: dto.isActive ?? true,
    });
  }
}
