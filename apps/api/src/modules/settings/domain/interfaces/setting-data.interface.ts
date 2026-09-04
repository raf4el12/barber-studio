export interface UpsertSettingData {
  key: string;
  value: string;
  /** null = global. */
  branchId: string | null;
}
