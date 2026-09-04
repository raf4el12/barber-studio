import { BadRequestException } from '@nestjs/common';
import { UpsertSettingUseCase } from './upsert-setting.use-case';
import type { ISettingRepository } from '../../domain/repositories/setting.repository';

describe('UpsertSettingUseCase', () => {
  let repo: jest.Mocked<Pick<ISettingRepository, 'upsert'>>;
  let useCase: UpsertSettingUseCase;

  beforeEach(() => {
    repo = { upsert: jest.fn() };
    useCase = new UpsertSettingUseCase(repo as unknown as ISettingRepository);
  });

  it('normaliza branchId ausente a null (global)', async () => {
    await useCase.execute({ key: 'tax_rate', value: '18' });
    expect(repo.upsert).toHaveBeenCalledWith({
      key: 'tax_rate',
      value: '18',
      branchId: null,
    });
  });

  it('guarda override por sucursal', async () => {
    await useCase.execute({
      key: 'tax_rate',
      value: '19',
      branchId: 'branch-1',
    });
    expect(repo.upsert).toHaveBeenCalledWith({
      key: 'tax_rate',
      value: '19',
      branchId: 'branch-1',
    });
  });

  it('rechaza clave vacía', async () => {
    await expect(useCase.execute({ key: '  ', value: '18' })).rejects.toThrow(
      BadRequestException,
    );
    expect(repo.upsert).not.toHaveBeenCalled();
  });
});
