export class SettingEntity {
  id!: string;
  /** null = configuración global; en otro caso, override de esa sucursal. */
  branchId!: string | null;
  key!: string;
  value!: string;
  updatedAt!: Date;
}
