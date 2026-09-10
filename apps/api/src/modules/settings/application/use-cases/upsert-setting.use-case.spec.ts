import { BadRequestException } from '@nestjs/common';
import { UpsertSettingUseCase } from './upsert-setting.use-case';
import type { ISettingRepository } from '../../domain/repositories/setting.repository';

describe('UpsertSettingUseCase', () => {
  let repo: jest.Mocked<Pick<ISettingRepository, 'upsert' | 'findByKey'>>;
  let audit: { execute: jest.Mock };
  let useCase: UpsertSettingUseCase;

  beforeEach(() => {
    repo = {
      upsert: jest
        .fn()
        .mockImplementation((data: object) =>
          Promise.resolve({ id: 's-1', ...data }),
        ),
      findByKey: jest.fn().mockResolvedValue(null),
    };
    audit = { execute: jest.fn().mockResolvedValue(undefined) };
    useCase = new UpsertSettingUseCase(
      repo as unknown as ISettingRepository,
      audit as never,
    );
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

  it('audita before/after del cambio', async () => {
    repo.findByKey.mockResolvedValue({
      id: 's-1',
      key: 'tax_rate',
      value: '18',
      branchId: null,
      updatedAt: new Date(),
    });
    await useCase.execute({ key: 'tax_rate', value: '19' }, 'owner-1');
    expect(audit.execute).toHaveBeenCalledWith({
      userId: 'owner-1',
      branchId: null,
      action: 'SETTING_CHANGED',
      entityType: 'Setting',
      entityId: 's-1',
      metadata: { key: 'tax_rate', before: '18', after: '19' },
    });
  });
});
