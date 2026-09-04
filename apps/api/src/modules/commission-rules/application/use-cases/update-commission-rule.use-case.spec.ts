import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CommissionType } from '@prisma/client';
import { UpdateCommissionRuleUseCase } from './update-commission-rule.use-case';
import type { ICommissionRuleRepository } from '../../domain/repositories/commission-rule.repository';
import type { CommissionRuleEntity } from '../../domain/entities/commission-rule.entity';

function existingRule(): CommissionRuleEntity {
  return {
    id: 'rule-1',
    name: null,
    priority: 0,
    type: CommissionType.PERCENTAGE,
    value: 10,
    isActive: true,
    barberId: null,
    serviceId: null,
    serviceCategoryId: null,
    productId: null,
    branchId: null,
    startsAt: null,
    endsAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };
}

describe('UpdateCommissionRuleUseCase', () => {
  let repo: jest.Mocked<Pick<ICommissionRuleRepository, 'findById' | 'update'>>;
  let useCase: UpdateCommissionRuleUseCase;

  beforeEach(() => {
    repo = {
      findById: jest.fn().mockResolvedValue(existingRule()),
      update: jest.fn(),
    };
    useCase = new UpdateCommissionRuleUseCase(
      repo as unknown as ICommissionRuleRepository,
    );
  });

  it('lanza NotFound cuando la regla no existe', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute('missing', { value: 20 })).rejects.toThrow(
      NotFoundException,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rechaza rango de fechas inválido contra el existente mezclado', async () => {
    await expect(
      useCase.execute('rule-1', {
        startsAt: '2026-08-01T00:00:00Z',
        endsAt: '2026-07-01T00:00:00Z',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('actualiza convirtiendo fechas', async () => {
    await useCase.execute('rule-1', { value: 20 });
    expect(repo.update).toHaveBeenCalledWith('rule-1', { value: 20 });
  });
});
