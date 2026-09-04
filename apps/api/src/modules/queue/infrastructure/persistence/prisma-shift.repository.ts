import { Inject, Injectable } from '@nestjs/common';
import {
  EXTENDED_PRISMA,
  type ExtendedPrismaService,
} from '../../../../prisma/prisma.service';
import type {
  IShiftRepository,
  OpenRegister,
} from '../../domain/repositories/shift.repository';

@Injectable()
export class PrismaShiftRepository implements IShiftRepository {
  constructor(
    @Inject(EXTENDED_PRISMA) private readonly prisma: ExtendedPrismaService,
  ) {}

  async findOpenRegister(branchId: string): Promise<OpenRegister | null> {
    const row = await this.prisma.cashRegister.findFirst({
      where: { branchId, closedAt: null },
      orderBy: { openedAt: 'desc' },
      select: { id: true, openedAt: true },
    });
    return row;
  }
}
