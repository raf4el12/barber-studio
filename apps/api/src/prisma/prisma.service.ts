import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { softDeleteExtension } from './soft-delete.extension';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Cliente con soft-delete aplicado. Comparte la misma conexión que `this`.
  withExtensions() {
    return this.$extends(softDeleteExtension);
  }
}

export type ExtendedPrismaService = ReturnType<PrismaService['withExtensions']>;
export const EXTENDED_PRISMA = Symbol('EXTENDED_PRISMA');
