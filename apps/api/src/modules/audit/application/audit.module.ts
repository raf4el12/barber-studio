import { Module } from '@nestjs/common';
import { AUDIT_LOG_REPOSITORY } from '../domain/repositories/audit.repository';
import { PrismaAuditLogRepository } from '../infrastructure/persistence/prisma-audit.repository';
import { AuditLogsController } from '../interfaces/controllers/audit-logs.controller';
import { WriteAuditLogUseCase } from './use-cases/write-audit-log.use-case';
import { ListAuditLogsUseCase } from './use-cases/list-audit-logs.use-case';

@Module({
  controllers: [AuditLogsController],
  providers: [
    { provide: AUDIT_LOG_REPOSITORY, useClass: PrismaAuditLogRepository },
    WriteAuditLogUseCase,
    ListAuditLogsUseCase,
  ],
  exports: [AUDIT_LOG_REPOSITORY, WriteAuditLogUseCase],
})
export class AuditModule {}
