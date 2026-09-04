import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CUSTOMER_REPOSITORY,
  type ICustomerRepository,
} from '../../domain/repositories/customer.repository';
import { UpdateCustomerDto } from '../dto/update-customer.dto';

@Injectable()
export class UpdateCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customers: ICustomerRepository,
  ) {}

  async execute(id: string, dto: UpdateCustomerDto) {
    const existing = await this.customers.findById(id);
    if (!existing) {
      throw new NotFoundException(`Cliente no encontrado: ${id}`);
    }
    if (dto.email !== undefined && dto.email !== null) {
      const email = dto.email.trim();
      if (email && (await this.customers.existsByEmail(email, id))) {
        throw new ConflictException('Ya existe un cliente con ese email');
      }
    }
    if (dto.phone !== undefined && dto.phone !== null) {
      const phone = dto.phone.trim();
      if (phone && (await this.customers.existsByPhone(phone, id))) {
        throw new ConflictException('Ya existe un cliente con ese teléfono');
      }
    }
    return this.customers.update(id, {
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
      ...(dto.email !== undefined && { email: dto.email?.trim() || null }),
      ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null }),
      ...(dto.branchId !== undefined && { branchId: dto.branchId }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });
  }
}
