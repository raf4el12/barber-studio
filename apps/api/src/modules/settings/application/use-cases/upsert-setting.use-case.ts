import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  SETTING_REPOSITORY,
  type ISettingRepository,
} from '../../domain/repositories/setting.repository';
import { UpsertSettingDto } from '../dto/upsert-setting.dto';

@Injectable()
export class UpsertSettingUseCase {
  constructor(
    @Inject(SETTING_REPOSITORY) private readonly settings: ISettingRepository,
  ) {}

  async execute(dto: UpsertSettingDto) {
    if (!dto.key?.trim()) {
      throw new BadRequestException('La clave de configuración es obligatoria');
    }
    return this.settings.upsert({
      key: dto.key.trim(),
      value: dto.value,
      branchId: dto.branchId ?? null,
    });
  }
}
