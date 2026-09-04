import { Inject, Injectable } from '@nestjs/common';
import {
  SETTING_REPOSITORY,
  type ISettingRepository,
} from '../../domain/repositories/setting.repository';

@Injectable()
export class ListSettingsUseCase {
  constructor(
    @Inject(SETTING_REPOSITORY) private readonly settings: ISettingRepository,
  ) {}

  async execute(branchId?: string) {
    const globals = await this.settings.findGlobals();
    if (!branchId) return globals;
    const overrides = await this.settings.findByBranch(branchId);
    const byKey = new Map(globals.map((s) => [s.key, s]));
    for (const override of overrides) byKey.set(override.key, override);
    return [...byKey.values()];
  }
}
