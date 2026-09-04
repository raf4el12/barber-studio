import { Module } from '@nestjs/common';
import { SETTING_REPOSITORY } from '../domain/repositories/setting.repository';
import { PrismaSettingRepository } from '../infrastructure/persistence/prisma-setting.repository';
import { SettingsController } from '../interfaces/controllers/settings.controller';
import { GetSettingUseCase } from './use-cases/get-setting.use-case';
import { ListSettingsUseCase } from './use-cases/list-settings.use-case';
import { UpsertSettingUseCase } from './use-cases/upsert-setting.use-case';

@Module({
  controllers: [SettingsController],
  providers: [
    { provide: SETTING_REPOSITORY, useClass: PrismaSettingRepository },
    GetSettingUseCase,
    ListSettingsUseCase,
    UpsertSettingUseCase,
  ],
  exports: [SETTING_REPOSITORY, GetSettingUseCase],
})
export class SettingsModule {}
