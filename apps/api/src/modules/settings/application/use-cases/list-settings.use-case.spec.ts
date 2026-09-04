import { ListSettingsUseCase } from './list-settings.use-case';
import type { ISettingRepository } from '../../domain/repositories/setting.repository';
import type { SettingEntity } from '../../domain/entities/setting.entity';

function setting(
  key: string,
  value: string,
  branchId: string | null = null,
): SettingEntity {
  return {
    id: `${branchId ?? 'global'}-${key}`,
    branchId,
    key,
    value,
    updatedAt: new Date(),
  };
}

describe('ListSettingsUseCase', () => {
  let repo: jest.Mocked<
    Pick<ISettingRepository, 'findGlobals' | 'findByBranch'>
  >;
  let useCase: ListSettingsUseCase;

  beforeEach(() => {
    repo = {
      findGlobals: jest.fn().mockResolvedValue([]),
      findByBranch: jest.fn().mockResolvedValue([]),
    };
    useCase = new ListSettingsUseCase(repo as unknown as ISettingRepository);
  });

  it('sin branchId devuelve solo las globales', async () => {
    repo.findGlobals.mockResolvedValue([setting('tax_rate', '18')]);
    const result = await useCase.execute();
    expect(result).toHaveLength(1);
    expect(repo.findByBranch).not.toHaveBeenCalled();
  });

  it('con branchId el override pisa al global por key', async () => {
    repo.findGlobals.mockResolvedValue([
      setting('tax_rate', '18'),
      setting('commission_base_percentage', '40'),
    ]);
    repo.findByBranch.mockResolvedValue([
      setting('tax_rate', '19', 'branch-1'),
    ]);
    const result = await useCase.execute('branch-1');
    const byKey = Object.fromEntries(result.map((s) => [s.key, s]));
    expect(byKey['tax_rate'].value).toBe('19');
    expect(byKey['tax_rate'].branchId).toBe('branch-1');
    expect(byKey['commission_base_percentage'].value).toBe('40');
  });
});
