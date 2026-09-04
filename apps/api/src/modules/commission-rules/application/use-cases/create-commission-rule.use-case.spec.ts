import { BadRequestException } from '@nestjs/common';
import { CommissionType } from '@prisma/client';
import { CreateCommissionRuleUseCase } from './create-commission-rule.use-case';
import type { ICommissionRuleRepository } from '../../domain/repositories/commission-rule.repository';

describe('CreateCommissionRuleUseCase', () => {
  let repo: jest.Mocked<Pick<ICommissionRuleRepository, 'create'>>;
  let audit: { execute: jest.Mock };
  let useCase: CreateCommissionRuleUseCase;

  beforeEach(() => {
    repo = {
      create: jest
        .fn()
        .mockImplementation((data: object) =>
          Promise.resolve({
            id: 'rule-1',
            createdAt: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-01-01T00:00:00Z'),
            ...data,
          }),
        ),
    };
    audit = { execute: jest.fn().mockResolvedValue(undefined) };
    useCase = new CreateCommissionRuleUseCase(
      repo as unknown as ICommissionRuleRepository,
      audit as never,
    );
  });

  const baseDto = { type: CommissionType.PERCENTAGE, value: 25 };

  it('crea con defaults normalizados (priority 0, isActive true, ámbitos null)', async () => {
    await useCase.execute({ ...baseDto });
    expect(repo.create).toHaveBeenCalledWith({
      name: null,
      priority: 0,
      type: CommissionType.PERCENTAGE,
      value: 25,
      isActive: true,
      barberId: null,
      serviceId: null,
      serviceCategoryId: null,
      productId: null,
      branchId: null,
      startsAt: null,
      endsAt: null,
    });
  });

  it('rechaza endsAt anterior a startsAt', async () => {
    await expect(
      useCase.execute({
        ...baseDto,
        startsAt: '2026-06-01T00:00:00Z',
        endsAt: '2026-05-01T00:00:00Z',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('rechaza regla de producto mezclada con ámbito de servicio', async () => {
    await expect(
      useCase.execute({
        ...baseDto,
        productId: 'product-wax',
        serviceId: 'service-1',
      }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      useCase.execute({
        ...baseDto,
        productId: 'product-wax',
        serviceCategoryId: 'cat-1',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('convierte fechas ISO a Date', async () => {
    await useCase.execute({
      ...baseDto,
      startsAt: '2026-06-01T00:00:00Z',
      endsAt: '2026-07-01T00:00:00Z',
    });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        startsAt: new Date('2026-06-01T00:00:00Z'),
        endsAt: new Date('2026-07-01T00:00:00Z'),
      }),
    );
  });
});
