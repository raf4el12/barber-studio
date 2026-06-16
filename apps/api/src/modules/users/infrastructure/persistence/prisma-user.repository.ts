import { Inject, Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import {
  EXTENDED_PRISMA,
  type ExtendedPrismaService,
} from '../../../../prisma/prisma.service';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import type {
  CreateUserData,
  UpdateUserData,
} from '../../domain/interfaces/user-data.interface';
import { UserEntity } from '../../domain/entities/user.entity';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(
    @Inject(EXTENDED_PRISMA) private readonly prisma: ExtendedPrismaService,
  ) {}

  async create(data: CreateUserData): Promise<UserEntity> {
    return this.toEntity(await this.prisma.user.create({ data }));
  }

  async findAll(): Promise<UserEntity[]> {
    const rows = await this.prisma.user.findMany({ orderBy: { name: 'asc' } });
    return rows.map((row) => this.toEntity(row));
  }

  async findById(id: string): Promise<UserEntity | null> {
    const row = await this.prisma.user.findFirst({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    return (await this.prisma.user.count({ where: { email } })) > 0;
  }

  async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    return this.toEntity(await this.prisma.user.update({ where: { id }, data }));
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Mapea la fila persistida a la entidad pública: descarta passwordHash y
  // convierte el Decimal de commissionRate en number.
  private toEntity(row: User): UserEntity {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      isActive: row.isActive,
      branchId: row.branchId,
      commissionRate:
        row.commissionRate === null ? null : Number(row.commissionRate),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
  }
}
