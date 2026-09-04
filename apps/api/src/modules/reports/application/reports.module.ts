import { Module } from '@nestjs/common';
import { REPORTS_REPOSITORY } from '../domain/repositories/reports.repository';
import { PrismaReportsRepository } from '../infrastructure/persistence/prisma-reports.repository';
import { ReportsController } from '../interfaces/controllers/reports.controller';
import { BuildZReportUseCase } from './use-cases/build-z-report.use-case';
import {
  GetBarberPayoutsUseCase,
  GetMetricsUseCase,
} from './use-cases/analytics.use-case';
import { CashRegistersModule } from '../../cash-registers/application/cash-registers.module';

@Module({
  imports: [CashRegistersModule],
  controllers: [ReportsController],
  providers: [
    { provide: REPORTS_REPOSITORY, useClass: PrismaReportsRepository },
    BuildZReportUseCase,
    GetBarberPayoutsUseCase,
    GetMetricsUseCase,
  ],
})
export class ReportsModule {}
