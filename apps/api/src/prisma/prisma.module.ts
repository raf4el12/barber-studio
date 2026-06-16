import { Global, Module } from '@nestjs/common';
import { PrismaService, EXTENDED_PRISMA } from './prisma.service';

@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: EXTENDED_PRISMA,
      useFactory: (prisma: PrismaService) => prisma.withExtensions(),
      inject: [PrismaService],
    },
  ],
  exports: [PrismaService, EXTENDED_PRISMA],
})
export class PrismaModule {}
