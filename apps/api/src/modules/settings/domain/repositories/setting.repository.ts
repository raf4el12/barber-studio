import type { SettingEntity } from '../entities/setting.entity';
import type { UpsertSettingData } from '../interfaces/setting-data.interface';

export const SETTING_REPOSITORY = 'ISettingRepository';

export interface ISettingRepository {
  /** Búsqueda exacta: branchId null = fila global. */
  findByKey(
    key: string,
    branchId: string | null,
  ): Promise<SettingEntity | null>;
  findGlobals(): Promise<SettingEntity[]>;
  findByBranch(branchId: string): Promise<SettingEntity[]>;
  /**
   * Crea o actualiza. Implementación manual (findFirst + create/update):
   * el @@unique([branchId, key]) no garantiza unicidad con NULL en Postgres,
   * así que no se puede usar el upsert nativo de Prisma para la fila global.
   */
  upsert(data: UpsertSettingData): Promise<SettingEntity>;
}
