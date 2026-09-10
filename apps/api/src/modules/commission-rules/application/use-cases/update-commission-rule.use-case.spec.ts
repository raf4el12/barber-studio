import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CommissionType } from '@prisma/client';
import { UpdateCommissionRuleUseCase } from './update-commission-rule.use-case';
import type { ICommissionRuleRepository } from '../../domain/repositories/commission-rule.repository';
import type { CommissionRuleEntity } from '../../domain/entities/commission-rule.entity';
import type { WriteAuditData } from '../../../audit/domain/interfaces/audit-data.interface';

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
  let audit: { execute: jest.Mock<Promise<void>, [WriteAuditData]> };
  let useCase: UpdateCommissionRuleUseCase;

  beforeEach(() => {
    repo = {
      findById: jest.fn().mockResolvedValue(existingRule()),
      update: jest
        .fn()
        .mockImplementation((_id: string, data: object) =>
          Promise.resolve({ ...existingRule(), ...data }),
        ),
    };
    audit = {
      execute: jest
        .fn<Promise<void>, [WriteAuditData]>()
        .mockResolvedValue(undefined),
    };
    useCase = new UpdateCommissionRuleUseCase(
      repo as unknown as ICommissionRuleRepository,
      audit as never,
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

  it('audita before/after con el usuario actor', async () => {
    repo.update.mockResolvedValue({ ...existingRule(), value: 20 });
    await useCase.execute('rule-1', { value: 20 }, 'owner-1');
    expect(audit.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'owner-1',
        branchId: null,
        action: 'COMMISSION_RULE_CHANGED',
        entityType: 'CommissionRule',
        entityId: 'rule-1',
      }),
    );
    const lastCall = audit.execute.mock.lastCall?.[0];
    const metadata = lastCall?.metadata as {
      operation: string;
      before: { value: number };
      after: { value: number };
    };
    expect(metadata.operation).toBe('update');
    expect(metadata.before.value).toBe(10);
    expect(metadata.after.value).toBe(20);
  });
});
