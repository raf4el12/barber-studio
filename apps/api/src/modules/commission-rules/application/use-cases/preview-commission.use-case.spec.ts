import { NotFoundException } from '@nestjs/common';
import { PreviewCommissionUseCase } from './preview-commission.use-case';
import type { ICommissionRuleRepository } from '../../domain/repositories/commission-rule.repository';
import type { IUserRepository } from '../../../users/domain/repositories/user.repository';
import type { IServiceRepository } from '../../../services/domain/repositories/service.repository';
import { CommissionResolverService } from '../services/commission-resolver.service';
import { GetSettingUseCase } from '../../../settings/application/use-cases/get-setting.use-case';
import { Role, CommissionType } from '@prisma/client';

function barber(overrides = {}) {
  return {
    id: 'barber-1',
    name: 'Barbero',
    email: 'barber@barber.studio',
    role: Role.BARBER,
    isActive: true,
    branchId: 'branch-1',
    commissionRate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

function setup() {
  const rules = { findAll: jest.fn().mockResolvedValue([]) };
  const users = { findById: jest.fn().mockResolvedValue(barber()) };
  const services = { findById: jest.fn() };
  const settings = { execute: jest.fn().mockResolvedValue({ value: '40' }) };
  const useCase = new PreviewCommissionUseCase(
    rules as unknown as ICommissionRuleRepository,
    users as unknown as IUserRepository,
    services as unknown as IServiceRepository,
    settings as unknown as GetSettingUseCase,
    new CommissionResolverService(),
  );
  return { rules, users, services, settings, useCase };
}

describe('PreviewCommissionUseCase', () => {
  it('lanza NotFound cuando el barbero no existe', async () => {
    const { users, useCase } = setup();
    users.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ barberId: 'missing', unitPrice: 100 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('usa la sucursal del barbero cuando el DTO no trae branchId', async () => {
    const { settings, useCase } = setup();
    const result = await useCase.execute({
      barberId: 'barber-1',
      unitPrice: 100,
    });
    expect(settings.execute).toHaveBeenCalledWith(
      'commission_base_percentage',
      'branch-1',
    );
    expect(result).toEqual({
      type: CommissionType.PERCENTAGE,
      value: 40,
      amount: 40,
      ruleId: null,
    });
  });

  it('usa el commissionRate del barbero como fallback', async () => {
    const { users, useCase } = setup();
    users.findById.mockResolvedValue(barber({ commissionRate: 50 }));
    const result = await useCase.execute({
      barberId: 'barber-1',
      unitPrice: 200,
    });
    expect(result.value).toBe(50);
    expect(result.amount).toBe(100);
  });

  it('resuelve la categoría del servicio para matchear reglas de categoría', async () => {
    const { services, rules, useCase } = setup();
    services.findById.mockResolvedValue({
      id: 'service-1',
      categoryId: 'cat-corte',
    });
    rules.findAll.mockResolvedValue([
      {
        id: 'rule-cat',
        name: null,
        priority: 0,
        type: CommissionType.PERCENTAGE,
        value: 20,
        isActive: true,
        barberId: null,
        serviceId: null,
        serviceCategoryId: 'cat-corte',
        productId: null,
        branchId: null,
        startsAt: null,
        endsAt: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);
    const result = await useCase.execute({
      barberId: 'barber-1',
      serviceId: 'service-1',
      unitPrice: 100,
    });
    expect(result.ruleId).toBe('rule-cat');
    expect(result.amount).toBe(20);
  });
});
