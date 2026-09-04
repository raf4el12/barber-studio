import { Module } from '@nestjs/common';
import { COMMISSION_RULE_REPOSITORY } from '../domain/repositories/commission-rule.repository';
import { PrismaCommissionRuleRepository } from '../infrastructure/persistence/prisma-commission-rule.repository';
import { CommissionRulesController } from '../interfaces/controllers/commission-rules.controller';
import { CommissionResolverService } from './services/commission-resolver.service';
import { CreateCommissionRuleUseCase } from './use-cases/create-commission-rule.use-case';
import { FindAllCommissionRulesUseCase } from './use-cases/find-all-commission-rules.use-case';
import { FindOneCommissionRuleUseCase } from './use-cases/find-one-commission-rule.use-case';
import { UpdateCommissionRuleUseCase } from './use-cases/update-commission-rule.use-case';
import { DeleteCommissionRuleUseCase } from './use-cases/delete-commission-rule.use-case';
import { PreviewCommissionUseCase } from './use-cases/preview-commission.use-case';
import { SettingsModule } from '../../settings/application/settings.module';
import { UsersModule } from '../../users/application/users.module';
import { ServicesModule } from '../../services/application/services.module';
import { AuditModule } from '../../audit/application/audit.module';

@Module({
  imports: [SettingsModule, UsersModule, ServicesModule, AuditModule],
  controllers: [CommissionRulesController],
  providers: [
    {
      provide: COMMISSION_RULE_REPOSITORY,
      useClass: PrismaCommissionRuleRepository,
    },
    CommissionResolverService,
    CreateCommissionRuleUseCase,
    FindAllCommissionRulesUseCase,
    FindOneCommissionRuleUseCase,
    UpdateCommissionRuleUseCase,
    DeleteCommissionRuleUseCase,
    PreviewCommissionUseCase,
  ],
  exports: [COMMISSION_RULE_REPOSITORY, CommissionResolverService],
})
export class CommissionRulesModule {}
