import { calculateLine, calculateTotals } from './ticket-totals.service';

describe('calculateLine', () => {
  it('servicio S/30 sin descuento con IGV 18%', () => {
    expect(calculateLine({ quantity: 1, unitPrice: 30, taxRate: 18 })).toEqual({
      lineBase: 30,
      discountAmount: 0,
      taxAmount: 5.4,
      lineTotal: 35.4,
    });
  });

  it('producto S/10 x2 con descuento S/5 e IGV 18%', () => {
    expect(
      calculateLine({
        quantity: 2,
        unitPrice: 10,
        discountAmount: 5,
        taxRate: 18,
      }),
    ).toEqual({
      lineBase: 20,
      discountAmount: 5,
      taxAmount: 2.7,
      lineTotal: 17.7,
    });
  });

  it('redondea a 2 decimales', () => {
    const line = calculateLine({ quantity: 3, unitPrice: 33.33, taxRate: 18 });
    expect(line.lineBase).toBe(99.99);
    expect(line.taxAmount).toBe(18);
    expect(line.lineTotal).toBe(117.99);
  });
});

describe('calculateTotals', () => {
  it('ticket del spec: servicio 30 + producto 10, IGV 18% → total 47.2', () => {
    const lines = [
      calculateLine({ quantity: 1, unitPrice: 30, taxRate: 18 }),
      calculateLine({ quantity: 1, unitPrice: 10, taxRate: 18 }),
    ];
    expect(calculateTotals(lines, 0)).toEqual({
      subtotal: 40,
      discountAmount: 0,
      taxAmount: 7.2,
      total: 47.2,
    });
  });

  it('descuento manual a nivel ticket reduce el total', () => {
    const lines = [calculateLine({ quantity: 1, unitPrice: 100, taxRate: 18 })];
    expect(calculateTotals(lines, 10)).toEqual({
      subtotal: 100,
      discountAmount: 10,
      taxAmount: 18,
      total: 108,
    });
  });
});
