import { Inject, Injectable } from '@nestjs/common';
import {
  EXTENDED_PRISMA,
  type ExtendedPrismaService,
} from '../../../../prisma/prisma.service';
import type { IBranchRepository } from '../../domain/repositories/branch.repository';
import type {
  CreateBranchData,
  UpdateBranchData,
} from '../../domain/interfaces/branch-data.interface';

@Injectable()
export class PrismaBranchRepository implements IBranchRepository {
  constructor(
    @Inject(EXTENDED_PRISMA) private readonly prisma: ExtendedPrismaService,
  ) {}

  create(data: CreateBranchData) {
    return this.prisma.branch.create({ data });
  }

  findAll() {
    return this.prisma.branch.findMany({ orderBy: { name: 'asc' } });
  }

  findById(id: string) {
    return this.prisma.branch.findFirst({ where: { id } });
  }

  update(id: string, data: UpdateBranchData) {
    return this.prisma.branch.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    await this.prisma.branch.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
