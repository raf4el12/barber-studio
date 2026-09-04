import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  SETTING_REPOSITORY,
  type ISettingRepository,
} from '../../domain/repositories/setting.repository';
import { UpsertSettingDto } from '../dto/upsert-setting.dto';
import { WriteAuditLogUseCase } from '../../../audit/application/use-cases/write-audit-log.use-case';
import { AuditAction } from '../../../audit/domain/constants/audit-actions';

@Injectable()
export class UpsertSettingUseCase {
  constructor(
    @Inject(SETTING_REPOSITORY) private readonly settings: ISettingRepository,
    private readonly audit: WriteAuditLogUseCase,
  ) {}

  async execute(dto: UpsertSettingDto, userId?: string) {
    if (!dto.key?.trim()) {
      throw new BadRequestException('La clave de configuración es obligatoria');
    }
    const key = dto.key.trim();
    const branchId = dto.branchId ?? null;
    const before = await this.settings.findByKey(key, branchId);
    const saved = await this.settings.upsert({ key, value: dto.value, branchId });
    await this.audit.execute({
      userId,
      branchId,
      action: AuditAction.SETTING_CHANGED,
      entityType: 'Setting',
      entityId: saved.id,
      metadata: { key, before: before?.value ?? null, after: saved.value },
    });
    return saved;
  }
}
