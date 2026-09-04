import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { UpsertSettingDto } from '../../application/dto/upsert-setting.dto';
import { GetSettingUseCase } from '../../application/use-cases/get-setting.use-case';
import { ListSettingsUseCase } from '../../application/use-cases/list-settings.use-case';
import { UpsertSettingUseCase } from '../../application/use-cases/upsert-setting.use-case';

@Controller('settings')
@Roles(Role.OWNER)
export class SettingsController {
  constructor(
    private readonly getSetting: GetSettingUseCase,
    private readonly listSettings: ListSettingsUseCase,
    private readonly upsertSetting: UpsertSettingUseCase,
  ) {}

  @Get()
  findAll(@Query('branchId') branchId?: string) {
    return this.listSettings.execute(branchId);
  }

  @Get(':key')
  findOne(@Param('key') key: string, @Query('branchId') branchId?: string) {
    return this.getSetting.execute(key, branchId);
  }

  @Put()
  upsert(@Body() dto: UpsertSettingDto) {
    return this.upsertSetting.execute(dto);
  }
}
