import { Inject, Injectable } from '@nestjs/common';
import type { Setting } from '@prisma/client';
import {
  EXTENDED_PRISMA,
  type ExtendedPrismaService,
} from '../../../../prisma/prisma.service';
import type { ISettingRepository } from '../../domain/repositories/setting.repository';
import type { UpsertSettingData } from '../../domain/interfaces/setting-data.interface';
import { SettingEntity } from '../../domain/entities/setting.entity';

@Injectable()
export class PrismaSettingRepository implements ISettingRepository {
  constructor(
    @Inject(EXTENDED_PRISMA) private readonly prisma: ExtendedPrismaService,
  ) {}

  findByKey(
    key: string,
    branchId: string | null,
  ): Promise<SettingEntity | null> {
    return this.prisma.setting
      .findFirst({ where: { key, branchId } })
      .then((row) => (row ? this.toEntity(row) : null));
  }

  async findGlobals(): Promise<SettingEntity[]> {
    const rows = await this.prisma.setting.findMany({
      where: { branchId: null },
      orderBy: { key: 'asc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findByBranch(branchId: string): Promise<SettingEntity[]> {
    const rows = await this.prisma.setting.findMany({
      where: { branchId },
      orderBy: { key: 'asc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async upsert(data: UpsertSettingData): Promise<SettingEntity> {
    const existing = await this.prisma.setting.findFirst({
      where: { key: data.key, branchId: data.branchId },
    });
    const row = existing
      ? await this.prisma.setting.update({
          where: { id: existing.id },
          data: { value: data.value },
        })
      : await this.prisma.setting.create({ data });
    return this.toEntity(row);
  }

  private toEntity(row: Setting): SettingEntity {
    return {
      id: row.id,
      branchId: row.branchId,
      key: row.key,
      value: row.value,
      updatedAt: row.updatedAt,
    };
  }
}
