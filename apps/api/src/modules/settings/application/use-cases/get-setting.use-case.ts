import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  SETTING_REPOSITORY,
  type ISettingRepository,
} from '../../domain/repositories/setting.repository';

@Injectable()
export class GetSettingUseCase {
  constructor(
    @Inject(SETTING_REPOSITORY) private readonly settings: ISettingRepository,
  ) {}

  async execute(key: string, branchId?: string) {
    if (branchId) {
      const override = await this.settings.findByKey(key, branchId);
      if (override) return override;
    }
    const global = await this.settings.findByKey(key, null);
    if (!global) {
      throw new NotFoundException(`Configuración no encontrada: ${key}`);
    }
    return global;
  }
}
