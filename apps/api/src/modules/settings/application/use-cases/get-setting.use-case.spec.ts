import { NotFoundException } from '@nestjs/common';
import { GetSettingUseCase } from './get-setting.use-case';
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

describe('GetSettingUseCase', () => {
  let repo: jest.Mocked<Pick<ISettingRepository, 'findByKey'>>;
  let useCase: GetSettingUseCase;

  beforeEach(() => {
    repo = { findByKey: jest.fn() };
    useCase = new GetSettingUseCase(repo as unknown as ISettingRepository);
  });

  it('devuelve el override de la sucursal cuando existe', async () => {
    repo.findByKey.mockResolvedValue(setting('tax_rate', '19', 'branch-1'));
    const result = await useCase.execute('tax_rate', 'branch-1');
    expect(result.value).toBe('19');
    expect(repo.findByKey).toHaveBeenCalledWith('tax_rate', 'branch-1');
  });

  it('cae al valor global cuando la sucursal no tiene override', async () => {
    repo.findByKey
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(setting('tax_rate', '18'));
    const result = await useCase.execute('tax_rate', 'branch-1');
    expect(result.value).toBe('18');
    expect(repo.findByKey).toHaveBeenNthCalledWith(2, 'tax_rate', null);
  });

  it('sin branchId lee directo la fila global', async () => {
    repo.findByKey.mockResolvedValue(
      setting('commission_base_percentage', '40'),
    );
    await useCase.execute('commission_base_percentage');
    expect(repo.findByKey).toHaveBeenCalledTimes(1);
    expect(repo.findByKey).toHaveBeenCalledWith(
      'commission_base_percentage',
      null,
    );
  });

  it('lanza NotFound cuando no hay ni override ni global', async () => {
    repo.findByKey.mockResolvedValue(null);
    await expect(useCase.execute('missing_key', 'branch-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
