import { CommissionType } from '@prisma/client';
import {
  CommissionResolverService,
  type ResolveCommissionInput,
} from './commission-resolver.service';
import type { CommissionRuleEntity } from '../../domain/entities/commission-rule.entity';

function rule(
  overrides: Partial<CommissionRuleEntity> = {},
): CommissionRuleEntity {
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
    ...overrides,
  };
}

function input(
  overrides: Partial<ResolveCommissionInput> = {},
): ResolveCommissionInput {
  return {
    rules: [],
    at: new Date('2026-06-01T12:00:00Z'),
    branchId: 'branch-1',
    barberId: 'barber-1',
    quantity: 1,
    unitPrice: 100,
    barberCommissionRate: null,
    basePercentage: 40,
    ...overrides,
  };
}

describe('CommissionResolverService', () => {
  let resolver: CommissionResolverService;

  beforeEach(() => {
    resolver = new CommissionResolverService();
  });

  it('sin reglas y barbero sin override usa commission_base_percentage', () => {
    const result = resolver.resolve(input());
    expect(result).toEqual({
      type: CommissionType.PERCENTAGE,
      value: 40,
      amount: 40,
      ruleId: null,
    });
  });

  it('barbero con commissionRate=50 usa 50% sobre el global', () => {
    const result = resolver.resolve(
      input({ barberCommissionRate: 50, unitPrice: 200 }),
    );
    expect(result).toEqual({
      type: CommissionType.PERCENTAGE,
      value: 50,
      amount: 100,
      ruleId: null,
    });
  });

  it('regla FIXED S/5 para producto cera: 3 ceras → comisión 15', () => {
    const waxRule = rule({
      id: 'rule-wax',
      type: CommissionType.FIXED,
      value: 5,
      productId: 'product-wax',
    });
    const result = resolver.resolve(
      input({
        rules: [waxRule],
        productId: 'product-wax',
        quantity: 3,
        unitPrice: 20,
      }),
    );
    expect(result).toEqual({
      type: CommissionType.FIXED,
      value: 5,
      amount: 15,
      ruleId: 'rule-wax',
    });
  });

  it('gana la regla de mayor especificidad aunque tenga menor priority', () => {
    const generic = rule({ id: 'rule-generic', value: 10, priority: 100 });
    const specific = rule({
      id: 'rule-specific',
      value: 25,
      priority: 0,
      barberId: 'barber-1',
      serviceId: 'service-1',
    });
    const result = resolver.resolve(
      input({ rules: [generic, specific], serviceId: 'service-1' }),
    );
    expect(result.ruleId).toBe('rule-specific');
    expect(result.amount).toBe(25);
  });

  it('a igual especificidad gana la de mayor priority', () => {
    const low = rule({
      id: 'rule-low',
      value: 10,
      priority: 1,
      serviceId: 'service-1',
    });
    const high = rule({
      id: 'rule-high',
      value: 30,
      priority: 10,
      serviceId: 'service-1',
    });
    const result = resolver.resolve(
      input({ rules: [low, high], serviceId: 'service-1' }),
    );
    expect(result.ruleId).toBe('rule-high');
    expect(result.amount).toBe(30);
  });

  it('regla con endsAt pasado no aplica (cae al fallback)', () => {
    const expired = rule({
      id: 'rule-expired',
      value: 90,
      endsAt: new Date('2026-05-01T00:00:00Z'),
    });
    const result = resolver.resolve(input({ rules: [expired] }));
    expect(result).toEqual({
      type: CommissionType.PERCENTAGE,
      value: 40,
      amount: 40,
      ruleId: null,
    });
  });

  it('regla con startsAt futuro no aplica', () => {
    const future = rule({
      id: 'rule-future',
      value: 90,
      startsAt: new Date('2026-07-01T00:00:00Z'),
    });
    const result = resolver.resolve(input({ rules: [future] }));
    expect(result.ruleId).toBeNull();
  });

  it('regla inactiva no aplica', () => {
    const inactive = rule({ id: 'rule-off', value: 90, isActive: false });
    const result = resolver.resolve(input({ rules: [inactive] }));
    expect(result.ruleId).toBeNull();
  });

  it('regla de otra sucursal no aplica', () => {
    const otherBranch = rule({
      id: 'rule-other',
      value: 90,
      branchId: 'branch-2',
    });
    const result = resolver.resolve(input({ rules: [otherBranch] }));
    expect(result.ruleId).toBeNull();
  });

  it('regla de categoría aplica al servicio de esa categoría', () => {
    const categoryRule = rule({
      id: 'rule-cat',
      type: CommissionType.PERCENTAGE,
      value: 20,
      serviceCategoryId: 'cat-corte',
    });
    const result = resolver.resolve(
      input({
        rules: [categoryRule],
        serviceId: 'service-degradado',
        serviceCategoryId: 'cat-corte',
      }),
    );
    expect(result.ruleId).toBe('rule-cat');
    expect(result.amount).toBe(20);
  });

  it('regla de servicio no aplica a otro servicio', () => {
    const otherService = rule({
      id: 'rule-other-svc',
      value: 90,
      serviceId: 'service-barba',
    });
    const result = resolver.resolve(
      input({ rules: [otherService], serviceId: 'service-corte' }),
    );
    expect(result.ruleId).toBeNull();
  });

  it('redondea el monto PERCENTAGE a 2 decimales', () => {
    const result = resolver.resolve(input({ unitPrice: 33.33, quantity: 3 }));
    expect(result.amount).toBe(40);
  });
});
